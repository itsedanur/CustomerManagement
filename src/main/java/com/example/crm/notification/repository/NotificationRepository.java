package com.example.crm.notification.repository;

import com.example.crm.notification.entity.Notification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
    Page<Notification> findByUser_Id(Long userId, Pageable pageable);
    
    List<Notification> findByUser_IdAndReadFalseOrderByCreatedAtDesc(Long userId);
    
    long countByUser_IdAndReadFalse(Long userId);
}
