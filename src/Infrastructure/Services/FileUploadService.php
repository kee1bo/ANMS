<?php

declare(strict_types=1);

namespace App\Infrastructure\Services;

use InvalidArgumentException;
use RuntimeException;

/**
 * File Upload Service
 * Handles secure file uploads with validation, processing, and storage
 */
class FileUploadService
{
    private string $uploadDir;
    private string $thumbnailDir;
    private array $allowedTypes;
    private int $maxFileSize;
    private array $imageQuality;

    public function __construct()
    {
        $this->uploadDir = __DIR__ . '/../../../public/storage/pet-photos';
        $this->thumbnailDir = $this->uploadDir . '/thumbnails';
        $this->allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        $this->maxFileSize = 5 * 1024 * 1024; // 5MB
        $this->imageQuality = [
            'jpeg' => 85,
            'webp' => 85,
            'png' => 9 // PNG compression level (0-9)
        ];

        $this->ensureDirectoriesExist();
    }

    /**
     * Upload and process a pet photo
     */
    public function uploadPetPhoto(array $file, int $petId): array
    {
        $this->validateFile($file);
        
        $originalName = $file['name'];
        $tempPath = $file['tmp_name'];
        $fileSize = $file['size'];
        $mimeType = $this->getMimeType($tempPath);
        
        // Generate unique filename
        $extension = $this->getExtensionFromMimeType($mimeType);
        $filename = $this->generateUniqueFilename($petId, $extension);
        $fullPath = $this->uploadDir . '/' . $filename;
        
        // Process and save the image
        $this->processAndSaveImage($tempPath, $fullPath, $mimeType);
        
        // Generate thumbnail
        $thumbnailPath = $this->thumbnailDir . '/' . $filename;
        $this->generateThumbnail($fullPath, $thumbnailPath, $mimeType);
        
        return [
            'filename' => $filename,
            'original_filename' => $originalName,
            'file_size' => $fileSize,
            'mime_type' => $mimeType,
            'url' => '/storage/pet-photos/' . $filename,
            'thumbnail_url' => '/storage/pet-photos/thumbnails/' . $filename
        ];
    }

    /**
     * Delete a pet photo and its thumbnail
     */
    public function deletePetPhoto(string $filename): bool
    {
        $fullPath = $this->uploadDir . '/' . $filename;
        $thumbnailPath = $this->thumbnailDir . '/' . $filename;
        
        $success = true;
        
        if (file_exists($fullPath)) {
            $success = $success && unlink($fullPath);
        }
        
        if (file_exists($thumbnailPath)) {
            $success = $success && unlink($thumbnailPath);
        }
        
        return $success;
    }

    /**
     * Get photo information
     */
    public function getPhotoInfo(string $filename): ?array
    {
        $fullPath = $this->uploadDir . '/' . $filename;
        
        if (!file_exists($fullPath)) {
            return null;
        }
        
        $imageInfo = getimagesize($fullPath);
        if (!$imageInfo) {
            return null;
        }
        
        return [
            'filename' => $filename,
            'path' => $fullPath,
            'url' => '/storage/pet-photos/' . $filename,
            'thumbnail_url' => '/storage/pet-photos/thumbnails/' . $filename,
            'width' => $imageInfo[0],
            'height' => $imageInfo[1],
            'mime_type' => $imageInfo['mime'],
            'file_size' => filesize($fullPath)
        ];
    }

    private function validateFile(array $file): void
    {
        // Check for upload errors
        if ($file['error'] !== UPLOAD_ERR_OK) {
            throw new InvalidArgumentException($this->getUploadErrorMessage($file['error']));
        }
        
        // Check file size
        if ($file['size'] > $this->maxFileSize) {
            throw new InvalidArgumentException('File size exceeds maximum allowed size of ' . ($this->maxFileSize / 1024 / 1024) . 'MB');
        }
        
        // Check if file was actually uploaded
        if (!is_uploaded_file($file['tmp_name'])) {
            throw new InvalidArgumentException('Invalid file upload');
        }
        
        // Validate MIME type
        $mimeType = $this->getMimeType($file['tmp_name']);
        if (!in_array($mimeType, $this->allowedTypes)) {
            throw new InvalidArgumentException('Invalid file type. Allowed types: ' . implode(', ', $this->allowedTypes));
        }
        
        // Additional security check - verify it's actually an image
        $imageInfo = getimagesize($file['tmp_name']);
        if (!$imageInfo) {
            throw new InvalidArgumentException('File is not a valid image');
        }
    }

    private function getMimeType(string $filePath): string
    {
        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $mimeType = finfo_file($finfo, $filePath);
        finfo_close($finfo);
        
        return $mimeType ?: 'application/octet-stream';
    }

    private function getExtensionFromMimeType(string $mimeType): string
    {
        $extensions = [
            'image/jpeg' => 'jpg',
            'image/png' => 'png',
            'image/webp' => 'webp',
            'image/gif' => 'gif'
        ];
        
        return $extensions[$mimeType] ?? 'jpg';
    }

    private function generateUniqueFilename(int $petId, string $extension): string
    {
        $timestamp = time();
        $random = bin2hex(random_bytes(8));
        return "pet_{$petId}_{$timestamp}_{$random}.{$extension}";
    }

    private function processAndSaveImage(string $sourcePath, string $destPath, string $mimeType): void
    {
        // Load the image based on type
        $image = $this->loadImage($sourcePath, $mimeType);
        if (!$image) {
            throw new RuntimeException('Failed to load image');
        }
        
        // Get original dimensions
        $originalWidth = imagesx($image);
        $originalHeight = imagesy($image);
        
        // Calculate new dimensions (max 1200px width/height while maintaining aspect ratio)
        $maxDimension = 1200;
        if ($originalWidth > $maxDimension || $originalHeight > $maxDimension) {
            if ($originalWidth > $originalHeight) {
                $newWidth = $maxDimension;
                $newHeight = (int)(($originalHeight / $originalWidth) * $maxDimension);
            } else {
                $newHeight = $maxDimension;
                $newWidth = (int)(($originalWidth / $originalHeight) * $maxDimension);
            }
            
            // Create resized image
            $resizedImage = imagecreatetruecolor($newWidth, $newHeight);
            
            // Preserve transparency for PNG and GIF
            if ($mimeType === 'image/png' || $mimeType === 'image/gif') {
                imagealphablending($resizedImage, false);
                imagesavealpha($resizedImage, true);
                $transparent = imagecolorallocatealpha($resizedImage, 255, 255, 255, 127);
                imagefill($resizedImage, 0, 0, $transparent);
            }
            
            imagecopyresampled($resizedImage, $image, 0, 0, 0, 0, $newWidth, $newHeight, $originalWidth, $originalHeight);
            imagedestroy($image);
            $image = $resizedImage;
        }
        
        // Save the processed image
        $this->saveImage($image, $destPath, $mimeType);
        imagedestroy($image);
    }

    private function generateThumbnail(string $sourcePath, string $destPath, string $mimeType): void
    {
        $image = $this->loadImage($sourcePath, $mimeType);
        if (!$image) {
            return; // Skip thumbnail generation if source can't be loaded
        }
        
        $originalWidth = imagesx($image);
        $originalHeight = imagesy($image);
        
        // Create square thumbnail (200x200)
        $thumbnailSize = 200;
        $thumbnail = imagecreatetruecolor($thumbnailSize, $thumbnailSize);
        
        // Preserve transparency
        if ($mimeType === 'image/png' || $mimeType === 'image/gif') {
            imagealphablending($thumbnail, false);
            imagesavealpha($thumbnail, true);
            $transparent = imagecolorallocatealpha($thumbnail, 255, 255, 255, 127);
            imagefill($thumbnail, 0, 0, $transparent);
        }
        
        // Calculate crop dimensions for square thumbnail
        $cropSize = min($originalWidth, $originalHeight);
        $cropX = (int)(($originalWidth - $cropSize) / 2);
        $cropY = (int)(($originalHeight - $cropSize) / 2);
        
        imagecopyresampled(
            $thumbnail, $image,
            0, 0, $cropX, $cropY,
            $thumbnailSize, $thumbnailSize, $cropSize, $cropSize
        );
        
        $this->saveImage($thumbnail, $destPath, $mimeType);
        imagedestroy($image);
        imagedestroy($thumbnail);
    }

    private function loadImage(string $path, string $mimeType)
    {
        switch ($mimeType) {
            case 'image/jpeg':
                return imagecreatefromjpeg($path);
            case 'image/png':
                return imagecreatefrompng($path);
            case 'image/webp':
                return imagecreatefromwebp($path);
            case 'image/gif':
                return imagecreatefromgif($path);
            default:
                return false;
        }
    }

    private function saveImage($image, string $path, string $mimeType): bool
    {
        switch ($mimeType) {
            case 'image/jpeg':
                return imagejpeg($image, $path, $this->imageQuality['jpeg']);
            case 'image/png':
                return imagepng($image, $path, $this->imageQuality['png']);
            case 'image/webp':
                return imagewebp($image, $path, $this->imageQuality['webp']);
            case 'image/gif':
                return imagegif($image, $path);
            default:
                return false;
        }
    }

    private function ensureDirectoriesExist(): void
    {
        if (!is_dir($this->uploadDir)) {
            if (!mkdir($this->uploadDir, 0755, true)) {
                throw new RuntimeException('Failed to create upload directory');
            }
        }
        
        if (!is_dir($this->thumbnailDir)) {
            if (!mkdir($this->thumbnailDir, 0755, true)) {
                throw new RuntimeException('Failed to create thumbnail directory');
            }
        }
    }

    private function getUploadErrorMessage(int $errorCode): string
    {
        $errors = [
            UPLOAD_ERR_INI_SIZE => 'File exceeds the upload_max_filesize directive',
            UPLOAD_ERR_FORM_SIZE => 'File exceeds the MAX_FILE_SIZE directive',
            UPLOAD_ERR_PARTIAL => 'File was only partially uploaded',
            UPLOAD_ERR_NO_FILE => 'No file was uploaded',
            UPLOAD_ERR_NO_TMP_DIR => 'Missing temporary folder',
            UPLOAD_ERR_CANT_WRITE => 'Failed to write file to disk',
            UPLOAD_ERR_EXTENSION => 'File upload stopped by extension'
        ];
        
        return $errors[$errorCode] ?? 'Unknown upload error';
    }
}