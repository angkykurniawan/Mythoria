-- ============================================================
-- SKEMA TABEL DATABASE MYTHORIA (EDISI MULTI-HALAMAN)
-- Cocok untuk diimpor ke phpMyAdmin (InfinityFree, cPanel, atau Localhost)
-- ============================================================

-- 1. Tabel Pengguna (Autentikasi & Role)
CREATE TABLE IF NOT EXISTS `users` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `username` VARCHAR(50) NOT NULL UNIQUE,
    `password` VARCHAR(255) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `role` ENUM('admin', 'user') NOT NULL DEFAULT 'user',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed Data Akun Bawaan (Admin & Dummy Users)
INSERT IGNORE INTO `users` (`id`, `username`, `password`, `name`, `role`) VALUES
(1, 'admin', '$2a$10$wN17i52j2q2e15/qXpE2te4wVbI5Xp6rQ5s2m5l3n4o5p6q7r8s9t', 'Sutradara Utama', 'admin'),
(2, 'penulis', '$2a$10$wN17i52j2q2e15/qXpE2te4wVbI5Xp6rQ5s2m5l3n4o5p6q7r8s9t', 'Penulis Naskah', 'user'),
(3, 'pembaca', '$2a$10$wN17i52j2q2e15/qXpE2te4wVbI5Xp6rQ5s2m5l3n4o5p6q7r8s9t', 'Kolektor Komik', 'user');

-- 2. Tabel Sesi Permainan
CREATE TABLE IF NOT EXISTS `game_sessions` (
    `id` VARCHAR(64) PRIMARY KEY,
    `title` VARCHAR(255) NOT NULL DEFAULT 'Sesi Baru',
    `stability` INT NOT NULL DEFAULT 100,
    `ink_jelaga` INT NOT NULL DEFAULT 15,
    `ink_gold` INT NOT NULL DEFAULT 5,
    `ink_blood` INT NOT NULL DEFAULT 2,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Tabel Halaman Buku Realitas (Book Pages)
CREATE TABLE IF NOT EXISTS `book_pages` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `session_id` VARCHAR(64) NOT NULL,
    `page_number` INT NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `summary` TEXT,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`session_id`) REFERENCES `game_sessions`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Tabel Manifestasi Kalimat (Terkoneksi ke Halaman)
CREATE TABLE IF NOT EXISTS `manifestations` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `session_id` VARCHAR(64) NOT NULL,
    `page_number` INT DEFAULT 1,
    `sentence` TEXT NOT NULL,
    `subject_part` VARCHAR(100),
    `action_part` VARCHAR(100),
    `modifier_part` VARCHAR(150),
    `ink_type` ENUM('jelaga', 'emas', 'darah') DEFAULT 'jelaga',
    `ai_story` TEXT,
    `comic_caption` VARCHAR(255),
    `sound_effect` VARCHAR(50) DEFAULT 'POW!',
    `is_redacted` TINYINT(1) DEFAULT 0,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`session_id`) REFERENCES `game_sessions`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Tabel Pemanggilan Karakter Sinema Jadul
CREATE TABLE IF NOT EXISTS `characters` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `session_id` VARCHAR(64) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `archetype` VARCHAR(100) NOT NULL,
    `dialogue` TEXT,
    `special_skill` VARCHAR(255),
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`session_id`) REFERENCES `game_sessions`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Tabel Robekan Realitas (Bekas Luka Pencoretan Naskah)
CREATE TABLE IF NOT EXISTS `reality_scars` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `session_id` VARCHAR(64) NOT NULL,
    `glitch_description` TEXT NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`session_id`) REFERENCES `game_sessions`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
