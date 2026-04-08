package com.vibe.vibeback.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

/**
 * 과제 파일 로컬 저장 서비스.
 * 실제 운영 환경에서는 AWS S3, NCloud Object Storage 등으로 교체 권장.
 */
@Service
public class FileStorageService {

    private final Path uploadRoot;

    private static final long MAX_FILE_SIZE = 50L * 1024 * 1024; // 50 MB

    private static final String[] ALLOWED_EXTENSIONS =
        { ".pdf", ".doc", ".docx", ".hwp", ".ppt", ".pptx", ".xls", ".xlsx",
          ".zip", ".jpg", ".jpeg", ".png" };

    public FileStorageService(@Value("${file.upload.dir}") String uploadDir) {
        this.uploadRoot = Paths.get(uploadDir).toAbsolutePath().normalize();
        try {
            Files.createDirectories(this.uploadRoot);
        } catch (IOException e) {
            throw new RuntimeException("업로드 디렉토리를 생성할 수 없습니다: " + uploadDir, e);
        }
    }

    /**
     * 파일을 서버에 저장하고 저장된 상대 경로를 반환합니다.
     *
     * @param file      업로드된 MultipartFile
     * @param subDir    세부 경로 (예: "course-1/assignment-3")
     * @return          저장된 파일의 상대 경로
     */
    public String store(MultipartFile file, String subDir) {
        if (file.isEmpty()) throw new IllegalArgumentException("빈 파일은 업로드할 수 없습니다.");
        if (file.getSize() > MAX_FILE_SIZE) throw new IllegalArgumentException("파일 크기가 50MB를 초과합니다.");

        String original = file.getOriginalFilename();
        String extension = getExtension(original);
        validateExtension(extension);

        // UUID로 저장명 충돌 방지
        String storedName = UUID.randomUUID() + extension;
        Path targetDir  = uploadRoot.resolve(subDir).normalize();
        Path targetFile = targetDir.resolve(storedName);

        try {
            Files.createDirectories(targetDir);
            Files.copy(file.getInputStream(), targetFile, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            throw new RuntimeException("파일 저장에 실패했습니다: " + original, e);
        }

        return subDir + "/" + storedName;
    }

    /** 저장된 파일을 삭제합니다. */
    public void delete(String relativePath) {
        Path target = uploadRoot.resolve(relativePath).normalize();
        try {
            Files.deleteIfExists(target);
        } catch (IOException e) {
            // 삭제 실패는 로그만 남기고 무시
        }
    }

    private String getExtension(String filename) {
        if (filename == null || !filename.contains(".")) return "";
        return filename.substring(filename.lastIndexOf('.')).toLowerCase();
    }

    private void validateExtension(String extension) {
        for (String allowed : ALLOWED_EXTENSIONS) {
            if (allowed.equals(extension)) return;
        }
        throw new IllegalArgumentException("허용되지 않는 파일 형식입니다: " + extension);
    }
}
