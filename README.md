# lottry

双色球 / 大乐透 历史数据分析与号码推荐的本地 HTML 应用。

## 使用

1. 用本地服务打开(因为用了 ES module + fetch,需 http 协议,不能直接 file:// 双击):

   ```bash
   python3 -m http.server 8000
   ```

   然后浏览器访问 http://localhost:8000/

2. 选择「双色球」或「大乐透」标签页
3. 点【生成 / 更新】抓取最新开奖数据并渲染分析表(数据会增量缓存到浏览器 localStorage,下次只补新增期)
4. 点【下载 Excel】导出带样式的 `.xlsx`(多级表头、五行颜色、分区底色、边框)
5. 点【号码推荐 / 换一组】用频率加权算法生成一组号码,多次点击换一组

## 文件

- `index.html` —— 页面结构 + 样式
- `lottery.js` —— 浏览器侧:抓取、localStorage 缓存、表格渲染、Excel 导出、交互
- `core.js` —— 纯分析逻辑(五行、相克、统计、推荐),可在 Node 下单测
- `headers.js` —— 多级表头常量(双色球 97 列 / 大乐透 102 列)
- `vendor/exceljs.min.js` —— 本地 Excel 导出库
- `lottery.py` —— 原始命令行版本,保留参考
- 单元测试:`node --test test/`

## 声明

彩票开奖完全随机,任何算法都无法提高中奖概率。推荐功能仅供娱乐,不构成任何投注建议。
