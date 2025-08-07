// view-database.js
// 查看数据库内容的脚本

import { Sequelize } from 'sequelize';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, 'cakepicnic.sqlite');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: dbPath
});

async function viewDatabase() {
  try {
    console.log('🔍 正在连接数据库...');
    await sequelize.authenticate();
    console.log('✅ 数据库连接成功！\n');

    // 查看所有表
    console.log('📋 数据库中的表：');
    const tables = await sequelize.query("SELECT name FROM sqlite_master WHERE type='table'");
    console.log(tables[0].map(table => `- ${table.name}`));
    console.log('');

    // 查看Users表
    console.log('👥 Users表数据：');
    const users = await sequelize.query('SELECT * FROM Users');
    if (users[0].length > 0) {
      users[0].forEach((user, index) => {
        console.log(`用户 ${index + 1}:`);
        console.log(`  ID: ${user.id}`);
        console.log(`  姓名: ${user.firstName} ${user.lastName}`);
        console.log(`  邮箱: ${user.email}`);
        console.log(`  以太坊地址: ${user.ethAddress || 'N/A'}`);
        console.log(`  类别: ${user.category || 'N/A'}`);
        console.log(`  已付款: ${user.hasPaid ? '是' : '否'}`);
        console.log(`  已签到: ${user.checkedIn ? '是' : '否'}`);
        console.log(`  创建时间: ${user.createdAt}`);
        console.log('');
      });
    } else {
      console.log('  暂无用户数据');
      console.log('');
    }

    // 查看Cakes表
    console.log('🍰 Cakes表数据：');
    const cakes = await sequelize.query('SELECT * FROM Cakes');
    if (cakes[0].length > 0) {
      cakes[0].forEach((cake, index) => {
        console.log(`蛋糕 ${index + 1}:`);
        console.log(`  ID: ${cake.id}`);
        console.log(`  标题: ${cake.title}`);
        console.log(`  描述: ${cake.description}`);
        console.log(`  图片URL: ${cake.imageUrl}`);
        console.log(`  文件类型: ${cake.fileType || 'N/A'}`);
        console.log(`  桌子号: ${cake.tableNumber || 'N/A'}`);
        console.log(`  座位号: ${cake.seatNumber || 'N/A'}`);
        console.log(`  故事: ${cake.story || 'N/A'}`);
        console.log(`  用户ID: ${cake.UserId}`);
        console.log(`  创建时间: ${cake.createdAt}`);
        console.log('');
      });
    } else {
      console.log('  暂无蛋糕数据');
      console.log('');
    }

    // 查看Votes表
    console.log('🗳️ Votes表数据：');
    const votes = await sequelize.query('SELECT * FROM Votes');
    if (votes[0].length > 0) {
      votes[0].forEach((vote, index) => {
        console.log(`投票 ${index + 1}:`);
        console.log(`  ID: ${vote.id}`);
        console.log(`  用户ID: ${vote.UserId}`);
        console.log(`  蛋糕ID: ${vote.CakeId}`);
        console.log(`  创建时间: ${vote.createdAt}`);
        console.log('');
      });
    } else {
      console.log('  暂无投票数据');
      console.log('');
    }

    // 统计信息
    console.log('📊 数据库统计：');
    const userCount = await sequelize.query('SELECT COUNT(*) as count FROM Users');
    const cakeCount = await sequelize.query('SELECT COUNT(*) as count FROM Cakes');
    const voteCount = await sequelize.query('SELECT COUNT(*) as count FROM Votes');
    
    console.log(`  用户总数: ${userCount[0][0].count}`);
    console.log(`  蛋糕总数: ${cakeCount[0][0].count}`);
    console.log(`  投票总数: ${voteCount[0][0].count}`);

  } catch (error) {
    console.error('❌ 查看数据库时出错:', error.message);
  } finally {
    await sequelize.close();
  }
}

viewDatabase(); 