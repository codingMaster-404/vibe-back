package com.vibe.vibeback.repository;

import com.vibe.vibeback.domain.InstructorProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface InstructorProfileRepository extends JpaRepository<InstructorProfile, Long> {

    /** user_id 로 단건 조회 */
    Optional<InstructorProfile> findByUserId(Long userId);

    /**
     * 운영자 강사 풀 조회 — 강의 생성 셀렉터용
     * User(nickname, email)과 InstructorProfile(specialty, isVerified, careerYears) 한 번에 로드.
     * keyword 가 null / 빈 문자열이면 전체 반환.
     */
    @Query("SELECT p FROM InstructorProfile p JOIN FETCH p.user u " +
           "WHERE (:keyword IS NULL OR :keyword = '' " +
           "       OR LOWER(u.nickname) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
           "       OR LOWER(u.email)    LIKE LOWER(CONCAT('%', :keyword, '%')) " +
           "       OR LOWER(p.specialty) LIKE LOWER(CONCAT('%', :keyword, '%'))) " +
           "ORDER BY p.isVerified DESC, p.careerYears DESC, u.nickname ASC")
    List<InstructorProfile> searchInstructorPool(@Param("keyword") String keyword);

    /**
     * 인증 완료된 강사만 반환 (셀렉터 기본 목록용)
     */
    @Query("SELECT p FROM InstructorProfile p JOIN FETCH p.user u " +
           "WHERE p.isVerified = true " +
           "ORDER BY p.careerYears DESC, u.nickname ASC")
    List<InstructorProfile> findVerifiedInstructors();
}
