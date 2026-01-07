const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'play_farm',
    multipleStatements: true
};

async function applyChanges() {
    let connection;
    try {
        console.log('Connecting to database...');
        connection = await mysql.createConnection(dbConfig);

        // 1. Add nickname to users
        try {
            const [columns] = await connection.query("SHOW COLUMNS FROM users LIKE 'nickname'");
            if (columns.length === 0) {
                await connection.query("ALTER TABLE users ADD COLUMN nickname VARCHAR(50) COMMENT '닉네임' AFTER name");
                console.log('✅ Added nickname column to users');
            }
        } catch (e) { console.log('Checking nickname:', e.message); }

        // 2. Add subtitle to events
        try {
            const [columns] = await connection.query("SHOW COLUMNS FROM events LIKE 'subtitle'");
            if (columns.length === 0) {
                await connection.query("ALTER TABLE events ADD COLUMN subtitle VARCHAR(255) COMMENT '이벤트 소제목' AFTER title");
                console.log('✅ Added subtitle column to events');
            }
        } catch (e) { console.log('Checking subtitle:', e.message); }

        // 3. Create notices
        await connection.query(`
            CREATE TABLE IF NOT EXISTS notices (
                id INT AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(255) NOT NULL COMMENT '공지 제목',
                content TEXT NOT NULL COMMENT '공지 내용',
                is_important BOOLEAN DEFAULT FALSE COMMENT '중요 공지 여부',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '작성일시',
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일시',
                INDEX idx_created_at (created_at),
                INDEX idx_is_important (is_important)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='공지사항 테이블';
        `);
        console.log('✅ Notices table check/create');

        // 4. Create faqs
        await connection.query(`
            CREATE TABLE IF NOT EXISTS faqs (
                id INT AUTO_INCREMENT PRIMARY KEY,
                question VARCHAR(255) NOT NULL COMMENT '질문',
                answer TEXT NOT NULL COMMENT '답변',
                category VARCHAR(50) DEFAULT '일반' COMMENT '카테고리',
                display_order INT DEFAULT 0 COMMENT '표시 순서',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '작성일시',
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일시',
                INDEX idx_display_order (display_order),
                INDEX idx_category (category)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='자주 묻는 질문 테이블';
        `);
        console.log('✅ FAQs table check/create');

    } catch (err) {
        console.error('Error:', err);
    } finally {
        if (connection) await connection.end();
    }
}
applyChanges();
