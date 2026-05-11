import { PDFDocument, rgb, PDFFont, PDFImage } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import { ResumeData } from '@/types/resume';
import fs from 'fs';
import path from 'path';

const FONT_FILE = 'NotoSansSC-Regular.ttf';

// 格式化值
const formatValue = (value: string | undefined | null): string => {
  if (!value || value === '') return '-';
  return value;
};

// 页面配置
const PAGE_CONFIG = {
  width: 595.28,
  height: 841.89,
  margin: 25,
  contentWidth: 545, // 595.28 - 25*2 = 545.28 ≈ 545
  cellHeight: 18,
  fontSize: 9,
  headerFontSize: 10,
  titleFontSize: 14,
  smallFontSize: 8,
};

// 需要左对齐的字段
const LEFT_ALIGN_FIELDS = ['户籍地', '现居住地址', '离职原因', '性格特点', '特长', '最有价值的项目和自我收获', '工作职责理解', '职业规划'];

// 绘制单元格（只绘制背景和文字，不绘制边框）
function drawCell(
  page: any,
  x: number,
  y: number,
  width: number,
  height: number,
  text: string,
  font: PDFFont,
  fontSize: number,
  options: {
    isHeader?: boolean;
    align?: 'left' | 'center' | 'right';
  } = {}
) {
  const { isHeader = false, align = 'center' } = options;

  // 绘制背景（标签灰色）
  if (isHeader) {
    page.drawRectangle({
      x,
      y: y - height,
      width,
      height,
      color: rgb(0.9, 0.9, 0.9), // 浅灰色
    });
  }

  // 计算文字位置
  const textWidth = font.widthOfTextAtSize(text, fontSize);
  let textX = x + 3;
  if (align === 'center') {
    textX = x + (width - textWidth) / 2;
  } else if (align === 'right') {
    textX = x + width - textWidth - 3;
  }
  const textY = y - height / 2 - fontSize / 2 + 1;

  // 绘制文字
  page.drawText(text, {
    x: textX,
    y: textY,
    size: fontSize,
    font,
    color: rgb(0, 0, 0),
  });
}

// 绘制表格框架（外框 + 内部网格线）
function drawTableFrame(
  page: any,
  x: number,
  y: number,
  width: number,
  totalHeight: number,
  columnWidths: number[],
  rowHeights: number[],
  headerRows: number = 1 // 前几行是表头（需要灰色背景）
) {
  // 绘制外框
  page.drawRectangle({
    x,
    y: y - totalHeight,
    width,
    height: totalHeight,
    borderColor: rgb(0, 0, 0),
    borderWidth: 1,
  });

  // 绘制水平分隔线（跳过最后一行，因为外框已绘制）
  let currentY = y;
  for (let i = 0; i < rowHeights.length - 1; i++) {
    currentY -= rowHeights[i];
    page.drawLine({
      start: { x, y: currentY },
      end: { x: x + width, y: currentY },
      thickness: 0.5,
      color: rgb(0, 0, 0),
    });
  }

  // 绘制垂直分隔线（跳过最后一列，因为外框已绘制）
  let currentX = x;
  for (let i = 0; i < columnWidths.length - 1; i++) {
    currentX += columnWidths[i];
    page.drawLine({
      start: { x: currentX, y },
      end: { x: currentX, y: y - totalHeight },
      thickness: 0.5,
      color: rgb(0, 0, 0),
    });
  }

  // 绘制表头背景色
  currentY = y;
  for (let row = 0; row < headerRows; row++) {
    const rowHeight = rowHeights[row];
    // 为表头的每个单元格绘制灰色背景
    let cellX = x;
    for (let col = 0; col < columnWidths.length; col++) {
      page.drawRectangle({
        x: cellX,
        y: currentY - rowHeight,
        width: columnWidths[col],
        height: rowHeight,
        color: rgb(0.9, 0.9, 0.9),
      });
      cellX += columnWidths[col];
    }
    currentY -= rowHeight;
  }
}

// 绘制区块标题栏（完整长方形边框）
function drawSectionHeader(
  page: any,
  x: number,
  y: number,
  width: number,
  title: string,
  font: PDFFont,
  fontSize: number
): number {
  const height = PAGE_CONFIG.cellHeight;

  // 灰色背景
  page.drawRectangle({
    x,
    y: y - height,
    width,
    height,
    color: rgb(0.85, 0.85, 0.85),
  });

  // 外框边框（使用1pt粗边框）
  page.drawRectangle({
    x,
    y: y - height,
    width,
    height,
    borderColor: rgb(0, 0, 0),
    borderWidth: 1,
  });

  // 标题文字
  page.drawText(title, {
    x: x + 4,
    y: y - height / 2 - fontSize / 2 + 1,
    size: fontSize,
    font,
    color: rgb(0, 0, 0),
  });

  return y - height;
}

// 绘制表格行边框（水平分隔线和垂直分隔线，不包含左右边框）
function drawRowBorder(
  page: any,
  x: number,
  y: number,
  width: number,
  height: number,
  columnWidths: number[],
  isFirstRow: boolean = false,
  isLastRow: boolean = false
) {
  // 绘制水平线（如果不是第一行）
  if (!isFirstRow) {
    page.drawLine({
      start: { x, y },
      end: { x: x + width, y },
      thickness: 0.5,
      color: rgb(0, 0, 0),
    });
  }

  // 绘制垂直分隔线（列之间的分隔线）
  let currentX = x;
  for (let i = 0; i < columnWidths.length - 1; i++) {
    currentX += columnWidths[i];
    page.drawLine({
      start: { x: currentX, y },
      end: { x: currentX, y: y - height },
      thickness: 0.5,
      color: rgb(0, 0, 0),
    });
  }
}

// 绘制完整表格的外围边框（上、左、右、下）
function drawTableOuterBorder(
  page: any,
  x: number,
  startY: number,
  endY: number,
  width: number
) {
  const lineWidth = 1;
  // 顶部边框
  page.drawLine({
    start: { x, y: startY },
    end: { x: x + width, y: startY },
    thickness: lineWidth,
    color: rgb(0, 0, 0),
  });
  // 左边框（贯穿整个表格高度）
  page.drawLine({
    start: { x, y: startY },
    end: { x, y: endY },
    thickness: lineWidth,
    color: rgb(0, 0, 0),
  });
  // 右边框（贯穿整个表格高度）
  page.drawLine({
    start: { x: x + width, y: startY },
    end: { x: x + width, y: endY },
    thickness: lineWidth,
    color: rgb(0, 0, 0),
  });
  // 底部边框
  page.drawLine({
    start: { x, y: endY },
    end: { x: x + width, y: endY },
    thickness: lineWidth,
    color: rgb(0, 0, 0),
  });
}

// 绘制表格底部边框
function drawTableBottomBorder(
  page: any,
  x: number,
  y: number,
  width: number
) {
  page.drawLine({
    start: { x, y },
    end: { x: x + width, y },
    thickness: 1,
    color: rgb(0, 0, 0),
  });
}

// 绘制表格左右边框
function drawTableSideBorders(
  page: any,
  x: number,
  y: number,
  width: number,
  height: number
) {
  // 左边框
  page.drawLine({
    start: { x, y },
    end: { x, y: y - height },
    thickness: 1,
    color: rgb(0, 0, 0),
  });
  // 右边框
  page.drawLine({
    start: { x: x + width, y },
    end: { x: x + width, y: y - height },
    thickness: 1,
    color: rgb(0, 0, 0),
  });
}

// 绘制表头行（带灰色背景和完整边框）
function drawHeaderRow(
  page: any,
  x: number,
  y: number,
  columnWidths: number[],
  headers: string[],
  font: PDFFont,
  fontSize: number,
  options: { isFirstRow?: boolean } = {}
): number {
  const height = PAGE_CONFIG.cellHeight;
  const totalWidth = columnWidths.reduce((a, b) => a + b, 0);
  let currentX = x;

  // 绘制表头文字和背景
  headers.forEach((header, i) => {
    drawCell(page, currentX, y, columnWidths[i], height, header, font, fontSize, { isHeader: true, align: 'center' });
    currentX += columnWidths[i];
  });

  // 绘制边框（只绘制水平线和垂直分隔线，不绘制外围边框）
  drawRowBorder(page, x, y, totalWidth, height, columnWidths, options.isFirstRow || false, false);

  return y - height;
}

// 绘制数据行（带边框）
function drawDataRow(
  page: any,
  x: number,
  y: number,
  columnWidths: number[],
  values: string[],
  font: PDFFont,
  fontSize: number,
  options: { isLastRow?: boolean } = {}
): number {
  const height = PAGE_CONFIG.cellHeight;
  const totalWidth = columnWidths.reduce((a, b) => a + b, 0);
  let currentX = x;

  // 绘制数据文字
  values.forEach((val, i) => {
    drawCell(page, currentX, y, columnWidths[i], height, val, font, fontSize, { align: 'center' });
    currentX += columnWidths[i];
  });

  // 绘制边框（只绘制水平线和垂直分隔线，不绘制外围边框）
  drawRowBorder(page, x, y, totalWidth, height, columnWidths, false, false);

  return y - height;
}

// 绘制4列表格行（带边框）
function drawFourColumnRow(
  page: any,
  x: number,
  y: number,
  widths: number[],
  label1: string,
  value1: string,
  label2: string,
  value2: string,
  font: PDFFont,
  fontSize: number,
  options: { isFirstRow?: boolean; isLastRow?: boolean } = {}
): number {
  const height = PAGE_CONFIG.cellHeight;
  const isLeftAlign1 = LEFT_ALIGN_FIELDS.includes(label1);
  const isLeftAlign2 = LEFT_ALIGN_FIELDS.includes(label2);
  const totalWidth = widths.reduce((a, b) => a + b, 0);

  let currentX = x;

  // 标签1
  drawCell(page, currentX, y, widths[0], height, label1, font, fontSize, { isHeader: true, align: 'center' });
  currentX += widths[0];

  // 内容1
  drawCell(page, currentX, y, widths[1], height, value1, font, fontSize, { align: isLeftAlign1 ? 'left' : 'center' });
  currentX += widths[1];

  // 标签2
  drawCell(page, currentX, y, widths[2], height, label2, font, fontSize, { isHeader: true, align: 'center' });
  currentX += widths[2];

  // 内容2
  drawCell(page, currentX, y, widths[3], height, value2, font, fontSize, { align: isLeftAlign2 ? 'left' : 'center' });

  // 绘制边框（只绘制水平线和垂直分隔线，不绘制外围边框）
  drawRowBorder(page, x, y, totalWidth, height, widths, options.isFirstRow || false, false);

  return y - height;
}

// 绘制6列表格行（标签|内容|标签|内容|标签|内容）- 带边框
function drawSixColumnRow(
  page: any,
  x: number,
  y: number,
  widths: number[],
  label1: string,
  value1: string,
  label2: string,
  value2: string,
  label3: string,
  value3: string,
  font: PDFFont,
  fontSize: number,
  options: { isFirstRow?: boolean; isLastRow?: boolean } = {}
): number {
  const height = PAGE_CONFIG.cellHeight;
  const isLeftAlign1 = LEFT_ALIGN_FIELDS.includes(label1);
  const isLeftAlign2 = LEFT_ALIGN_FIELDS.includes(label2);
  const isLeftAlign3 = LEFT_ALIGN_FIELDS.includes(label3);
  const totalWidth = widths.reduce((a, b) => a + b, 0);

  let currentX = x;

  // 标签1
  drawCell(page, currentX, y, widths[0], height, label1, font, fontSize, { isHeader: true, align: 'center' });
  currentX += widths[0];

  // 内容1
  drawCell(page, currentX, y, widths[1], height, value1, font, fontSize, { align: isLeftAlign1 ? 'left' : 'center' });
  currentX += widths[1];

  // 标签2
  drawCell(page, currentX, y, widths[2], height, label2, font, fontSize, { isHeader: true, align: 'center' });
  currentX += widths[2];

  // 内容2
  drawCell(page, currentX, y, widths[3], height, value2, font, fontSize, { align: isLeftAlign2 ? 'left' : 'center' });
  currentX += widths[3];

  // 标签3
  drawCell(page, currentX, y, widths[4], height, label3, font, fontSize, { isHeader: true, align: 'center' });
  currentX += widths[4];

  // 内容3
  drawCell(page, currentX, y, widths[5], height, value3, font, fontSize, { align: isLeftAlign3 ? 'left' : 'center' });

  // 绘制边框（只绘制水平线和垂直分隔线，不绘制外围边框）
  drawRowBorder(page, x, y, totalWidth, height, widths, options.isFirstRow || false, false);

  return y - height;
}

// 绘制2列表格行（标签 + 内容，内容跨列）- 带边框
function drawTwoColumnRow(
  page: any,
  x: number,
  y: number,
  labelWidth: number,
  contentWidth: number,
  label: string,
  value: string,
  font: PDFFont,
  fontSize: number,
  options: { isFirstRow?: boolean; isLastRow?: boolean } = {}
): number {
  const height = PAGE_CONFIG.cellHeight;
  const isLeftAlign = LEFT_ALIGN_FIELDS.includes(label);
  const totalWidth = labelWidth + contentWidth;
  const widths = [labelWidth, contentWidth];

  // 标签
  drawCell(page, x, y, labelWidth, height, label, font, fontSize, { isHeader: true, align: 'center' });

  // 内容
  drawCell(page, x + labelWidth, y, contentWidth, height, value, font, fontSize, { align: isLeftAlign ? 'left' : 'center' });

  // 绘制边框（只绘制水平线和垂直分隔线，不绘制外围边框）
  drawRowBorder(page, x, y, totalWidth, height, widths, options.isFirstRow || false, false);

  return y - height;
}

// 截断文本
function truncateText(text: string, font: PDFFont, size: number, maxWidth: number): string {
  if (!text || text === '-') return '-';
  const width = font.widthOfTextAtSize(text, size);
  if (width <= maxWidth) return text;
  let truncated = text;
  while (font.widthOfTextAtSize(truncated + '…', size) > maxWidth && truncated.length > 0) {
    truncated = truncated.slice(0, -1);
  }
  return truncated + '…';
}

// 绘制自动换行文本
function drawWrappedText(
  page: any,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  font: PDFFont,
  size: number,
  lineHeight: number = size + 3
): number {
  const lines: string[] = [];
  let currentLine = '';
  for (const char of text) {
    const testLine = currentLine + char;
    if (font.widthOfTextAtSize(testLine, size) > maxWidth) {
      if (currentLine) lines.push(currentLine);
      currentLine = char;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) lines.push(currentLine);

  lines.forEach((line, i) => {
    page.drawText(line, { x, y: y - i * lineHeight, size, font, color: rgb(0, 0, 0) });
  });

  return lines.length * lineHeight;
}

// 计算文本需要的行数
function calculateTextLines(text: string, font: PDFFont, size: number, maxWidth: number): number {
  if (!text || text === '-') return 1;
  const lines: string[] = [];
  let currentLine = '';
  for (const char of text) {
    const testLine = currentLine + char;
    if (font.widthOfTextAtSize(testLine, size) > maxWidth) {
      if (currentLine) lines.push(currentLine);
      currentLine = char;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines.length || 1;
}

// 绘制可变高度的多行单元格（标签+内容）- 内部计算高度并返回新 y 坐标
function drawMultilineCell(
  page: any,
  x: number,
  y: number,
  labelWidth: number,
  contentWidth: number,
  label: string,
  value: string,
  font: PDFFont,
  fontSize: number,
  options: { maxHeight?: number; isFirstRow?: boolean; isLastRow?: boolean } = {}
): number {
  const lineHeight = fontSize + 4; // 行高 = 13
  const padding = 4; // 内边距 = 4
  const totalWidth = labelWidth + contentWidth;

  // 使用固定的 maxHeight，而不是自适应计算
  const contentHeight = options.maxHeight || (fontSize + padding * 2);

  // 计算最大行数
  const maxLines = Math.floor((contentHeight - padding * 2) / lineHeight);

  // 1. 分行并限制行数 (已修复 \n 导致的排版错乱问题)
  const lines: string[] = [];
  const maxTextWidth = contentWidth - padding * 2;

  if (value && value !== '-') {
    // 【关键修复】：先按原始文本中的换行符分割成段落
    const paragraphs = value.split(/\r?\n/);

    for (const paragraph of paragraphs) {
      if (lines.length >= maxLines) break; // 已达到最大行数，停止处理后续段落

      let currentLine = '';
      for (const char of paragraph) {
        const testLine = currentLine + char;
        if (font.widthOfTextAtSize(testLine, fontSize) > maxTextWidth) {
          if (currentLine && lines.length < maxLines) {
            lines.push(currentLine);
          }
          currentLine = char; // 新起一行
          if (lines.length >= maxLines) break; // 及时阻断
        } else {
          currentLine = testLine;
        }
      }
      
      // 推入该段落剩余的最后一行
      if (currentLine && lines.length < maxLines) {
        lines.push(currentLine);
      }
    }
  }

  // 3. 绘制标签列：灰色背景（完整矩形）
  page.drawRectangle({
    x,
    y: y - contentHeight,
    width: labelWidth,
    height: contentHeight,
    color: rgb(0.9, 0.9, 0.9),
  });

  // 4. 绘制内容列：白色背景（完整矩形）
  page.drawRectangle({
    x: x + labelWidth,
    y: y - contentHeight,
    width: contentWidth,
    height: contentHeight,
    color: rgb(1, 1, 1),
  });

  // 5. 绘制标签文字（垂直居中、水平居中）
  const labelY = y - contentHeight / 2 - fontSize / 2 + 1;
  page.drawText(label, {
    x: x + (labelWidth - font.widthOfTextAtSize(label, fontSize)) / 2,
    y: labelY,
    size: fontSize,
    font,
    color: rgb(0, 0, 0),
  });

  // 6. 绘制内容文字（顶部对齐、水平靠左）
  const startY = y - padding - fontSize;
  const contentX = x + labelWidth + padding;

  if (lines.length > 0) {
    lines.forEach((line, i) => {
      page.drawText(line, {
        x: contentX,
        y: startY - i * lineHeight,
        size: fontSize,
        font,
        color: rgb(0, 0, 0),
      });
    });
  } else {
    // 显示占位符（垂直居中）
    page.drawText('-', {
      x: x + labelWidth + (contentWidth - font.widthOfTextAtSize('-', fontSize)) / 2,
      y: y - contentHeight / 2 - fontSize / 2 + 1,
      size: fontSize,
      font,
      color: rgb(0, 0, 0),
    });
  }

  // 6. 绘制完整单元格边框（上、下、中间垂直线）
  // 上边框（如果不是第一个字段）
  if (!options.isFirstRow) {
    page.drawLine({
      start: { x, y },
      end: { x: x + totalWidth, y },
      thickness: 0.5,
      color: rgb(0, 0, 0),
    });
  }

  // 下边框
  page.drawLine({
    start: { x, y: y - contentHeight },
    end: { x: x + totalWidth, y: y - contentHeight },
    thickness: 0.5,
    color: rgb(0, 0, 0),
  });

  // 中间垂直分隔线
  page.drawLine({
    start: { x: x + labelWidth, y },
    end: { x: x + labelWidth, y: y - contentHeight },
    thickness: 0.5,
    color: rgb(0, 0, 0),
  });

  // 7. 返回新的 Y 坐标
  return y - contentHeight;
}

// 检查分页（基础版本）
function checkNewPage(pdfDoc: PDFDocument, currentPage: any, y: number, requiredSpace: number): { page: any; y: number; isNewPage: boolean } {
  // 底部保留区域45pt（页脚空间），距离页面底部不能少于 45 像素
  if (y - requiredSpace < 45) {
    const newPage = pdfDoc.addPage([PAGE_CONFIG.width, PAGE_CONFIG.height]);
    return { page: newPage, y: PAGE_CONFIG.height - PAGE_CONFIG.margin, isNewPage: true };
  }
  return { page: currentPage, y, isNewPage: false };
}

// 检查分页并重绘表头（用于表格跨页）
function checkNewPageWithTableHeader(
  pdfDoc: PDFDocument, 
  currentPage: any, 
  y: number, 
  requiredSpace: number,
  drawTableHeader: (page: any, y: number) => number
): { page: any; y: number } {
  const result = checkNewPage(pdfDoc, currentPage, y, requiredSpace);
  if (result.isNewPage) {
    // 新页面，先绘制模块标题和表头
    result.y = drawTableHeader(result.page, result.y);
  }
  return { page: result.page, y: result.y };
}

// 生成 PDF（极简版：只返回 Buffer 和文件名，不写磁盘）
export async function generatePDFWithPdfLib(data: ResumeData): Promise<{ 
  buffer: Buffer; 
  filename: string; 
}> {
  try {
    const pdfDoc = await PDFDocument.create();
    pdfDoc.registerFontkit(fontkit);

    // 加载字体
    const fontPath = path.join(process.cwd(), 'public', 'fonts', FONT_FILE);
    if (!fs.existsSync(fontPath)) {
      throw new Error(`字体文件缺失: ${fontPath}`);
    }
    const fontBytes = fs.readFileSync(fontPath);
    const font = await pdfDoc.embedFont(fontBytes, { subset: false });

    // 加载 logo
    let logo: PDFImage | null = null;
    const logoPath = path.join(process.cwd(), 'public', 'logo.png');
    if (fs.existsSync(logoPath)) {
      const logoBytes = fs.readFileSync(logoPath);
      logo = await pdfDoc.embedPng(logoBytes);
    }

    // 添加第一页
    let page = pdfDoc.addPage([PAGE_CONFIG.width, PAGE_CONFIG.height]);
    let y = PAGE_CONFIG.height - PAGE_CONFIG.margin;
    const { margin, contentWidth, cellHeight, fontSize, headerFontSize, titleFontSize, smallFontSize } = PAGE_CONFIG;

    // ========== 头部区域 ==========
    // Logo（左上角，小尺寸）
    if (logo) {
      const logoScale = 0.06;  // 更小的logo
      const logoWidth = logo.width * logoScale;
      const logoHeight = logo.height * logoScale;
      page.drawImage(logo, {
        x: margin,
        y: y - logoHeight,
        width: logoWidth,
        height: logoHeight,
      });
    }

    // 标题（居中）
    const title = '应聘人员信息登记表';
    const titleWidth = font.widthOfTextAtSize(title, titleFontSize);
    page.drawText(title, {
      x: (PAGE_CONFIG.width - titleWidth) / 2,
      y: y - 5,
      size: titleFontSize,
      font,
      color: rgb(0, 0, 0),
    });

    // 提交时间（标题下方）
    const submitTime = `提交时间：${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}`;
    const submitTimeWidth = font.widthOfTextAtSize(submitTime, smallFontSize);
    page.drawText(submitTime, {
      x: (PAGE_CONFIG.width - submitTimeWidth) / 2,
      y: y - 22,
      size: smallFontSize,
      font,
      color: rgb(0.5, 0.5, 0.5),
    });

    y -= 45;

    // ========== 统一列宽配置 ==========
    // 所有表格统一使用以下列宽定义，确保垂直线对齐
    // 6列布局（标签|内容|标签|内容|标签|内容）
    const col6: number[] = [81, 100, 81, 100, 81, 102]; // 总和 545
    // 4列布局（标签|内容|标签|内容）- 由6列合并得到，确保前4列宽度一致
    const col4: number[] = [81, 100, 81, 283]; // 前三列与6列一致，第四列为后三列合并
    // 2列布局（标签|内容）- 由6列合并得到
    const col2: number[] = [81, 464]; // 标签列与6列一致，内容列为后5列合并

    // ========== 一、岗位信息 ==========
    // 构建标题，包含应聘渠道信息
    let channelInfo = formatValue(data.channel_type);
    if (data.channel_type === '内部推荐' && data.channel_referrer) {
      channelInfo += ` - 推荐人：${data.channel_referrer}`;
    } else if (data.channel_type === '其他渠道' && data.channel_other) {
      channelInfo += ` - ${data.channel_other}`;
    }
    y = drawSectionHeader(page, margin, y, contentWidth, `一、岗位信息（${channelInfo}）`, font, headerFontSize);
    let channelStartY = y;  // 在标题之后记录表格起始位置

    // 第一行：应聘岗位 | 内容 | 预计到岗时间 | 内容 | 岗位性质 | 内容（6列）
    y = drawSixColumnRow(page, margin, y, col6,
      '应聘岗位', formatValue(data.post),
      '预计到岗时间', formatValue(data.entry_date),
      '岗位性质', formatValue(data.job_type),
      font, fontSize, { isFirstRow: true });

    // 第二行：当前状态 | 内容 | 目前月薪(税前) | 内容 | 期望月薪(税前) | 内容（6列）
    y = drawSixColumnRow(page, margin, y, col6,
      '当前状态', data.current_status === '其他' ? formatValue(data.current_status_other) : formatValue(data.current_status),
      '目前月薪(税前)', formatValue(data.current_salary),
      '期望月薪(税前)', formatValue(data.salary_expectation),
      font, fontSize);

    // 绘制完整的外围边框（上、左、右、下）
    drawTableOuterBorder(page, margin, channelStartY, y, contentWidth);

    y -= 5;

    // ========== 二、个人资料 ==========
    // 个人资料固定7行表格：标题(18) + 7行(126) + 间距(15) ≈ 160
    let pageCheck = checkNewPage(pdfDoc, page, y, 160);
    page = pageCheck.page;
    y = pageCheck.y;

    y = drawSectionHeader(page, margin, y, contentWidth, '二、个人资料', font, headerFontSize);
    let personalStartY = y;  // 在标题之后记录表格起始位置

    // 第一行：姓名(中文) | 内容 | 姓名(英文) | 内容 | 性别 | 内容（6列）
    y = drawSixColumnRow(page, margin, y, col6,
      '姓名(中文)', formatValue(data.name),
      '姓名(英文)', formatValue(data.name_en),
      '性别', formatValue(data.sex),
      font, fontSize, { isFirstRow: true });

    // 第二行：出生日期 | 内容 | 兴趣爱好 | 内容 | 婚姻状况 | 内容（6列）
    y = drawSixColumnRow(page, margin, y, col6,
      '出生日期', formatValue(data.birthday),
      '兴趣爱好', formatValue(data.hobby),
      '婚姻状况', formatValue(data.marriage),
      font, fontSize);

    // 第三行：毕业院校 | 内容 | 最高学历 | 内容 | 专业 | 内容（6列）
    y = drawSixColumnRow(page, margin, y, col6,
      '毕业院校', truncateText(formatValue(data.school), font, fontSize, col6[1] - 6),
      '最高学历', formatValue(data.degree),
      '专业', truncateText(formatValue(data.major), font, fontSize, col6[5] - 6),
      font, fontSize);

    // 第四行：手机 | 内容 | 电子邮件 | 内容（4列）
    y = drawFourColumnRow(page, margin, y, col4,
      '手机', formatValue(data.mobilephone),
      '电子邮件', formatValue(data.email),
      font, fontSize);

    // 第五行：户籍地（2列）
    y = drawTwoColumnRow(page, margin, y, col2[0], col2[1],
      '户籍地', truncateText(formatValue(data.household_address), font, fontSize, col2[1] - 6),
      font, fontSize);

    // 第六行：现居住地址（2列）
    y = drawTwoColumnRow(page, margin, y, col2[0], col2[1],
      '现居住地址', truncateText(formatValue(data.living_address), font, fontSize, col2[1] - 6),
      font, fontSize);

    // 第七行：是否曾患重大疾病 | 内容 | 是否发生劳动纠纷 | 内容 | 是否有犯罪记录 | 内容（6列）
    y = drawSixColumnRow(page, margin, y, col6,
      '是否曾患重大疾病', formatValue(data.has_disease),
      '是否发生劳动纠纷', formatValue(data.has_dispute),
      '是否有犯罪记录', formatValue(data.has_criminal),
      font, fontSize);

    // 绘制完整的外围边框（上、左、右、下）
    drawTableOuterBorder(page, margin, personalStartY, y, contentWidth);

    y -= 5;

    // ========== 三、教育经历 ==========
    // 教育经历表头（6列）
    const eduWidths: number[] = [60, 60, 140, 100, 60, 125]; // 起始、终止、学校、专业、学历、证书，总和 545
    const eduHeaders = ['起始', '终止', '学校名称', '专业', '学历', '证书/学位'];
    
    // 绘制教育经历表头的函数（用于跨页重绘）
    const drawEduHeader = (p: any, startY: number): number => {
      let hy = drawSectionHeader(p, margin, startY, contentWidth, '三、教育经历（请从高中开始填写）（续）', font, headerFontSize);
      hy = drawHeaderRow(p, margin, hy, eduWidths, eduHeaders, font, fontSize, { isFirstRow: true });
      return hy;
    };

    // 检查第一页空间
    pageCheck = checkNewPage(pdfDoc, page, y, 54); // 至少需要标题+表头+一行数据
    page = pageCheck.page;
    y = pageCheck.y;

    y = drawSectionHeader(page, margin, y, contentWidth, '三、教育经历（请从高中开始填写）', font, headerFontSize);

    // 绘制表头行（带边框）
    y = drawHeaderRow(page, margin, y, eduWidths, eduHeaders, font, fontSize, { isFirstRow: true });
    let eduStartY = y + cellHeight;  // 记录表头起始位置（包含表头）

    // 教育经历内容
    if (data.education_detail && data.education_detail.length > 0) {
      data.education_detail.forEach((edu, index) => {
        // 检查是否需要分页，如果需要则重绘表头
        const eduResult = checkNewPage(pdfDoc, page, y, cellHeight + 5);
        if (eduResult.isNewPage) {
          // 在分页前绘制当前页的边框
          drawTableOuterBorder(page, margin, eduStartY, y, contentWidth);
          page = eduResult.page;
          y = drawEduHeader(page, eduResult.y);
          eduStartY = y + cellHeight;  // 重置起始位置
        } else {
          page = eduResult.page;
          y = eduResult.y;
        }

        const eduValues = [
          edu.start || '-',
          edu.end || '-',
          truncateText(edu.school || '-', font, fontSize, eduWidths[2] - 6),
          truncateText(edu.major || '-', font, fontSize, eduWidths[3] - 6),
          edu.degree || '-',
          truncateText(edu.certificate || '-', font, fontSize, eduWidths[5] - 6)
        ];
        y = drawDataRow(page, margin, y, eduWidths, eduValues, font, fontSize);
      });
      // 绘制最后一页的边框
      drawTableOuterBorder(page, margin, eduStartY, y, contentWidth);
    } else {
      y = drawDataRow(page, margin, y, [contentWidth], ['-'], font, fontSize);
      drawTableOuterBorder(page, margin, eduStartY, y, contentWidth);
    }
    y -= 5;

    // ========== 四、家庭信息 ==========
    // 家庭信息表头（5列）
    const familyWidths: number[] = [85, 65, 190, 110, 95]; // 姓名、关系、工作单位、职位、年龄，总和 545
    const familyHeaders = ['姓名', '关系', '工作单位', '职位', '年龄'];
    
    // 绘制家庭信息表头的函数（用于跨页重绘）
    const drawFamilyHeader = (p: any, startY: number): number => {
      let hy = drawSectionHeader(p, margin, startY, contentWidth, '四、家庭信息（续）', font, headerFontSize);
      hy = drawHeaderRow(p, margin, hy, familyWidths, familyHeaders, font, fontSize, { isFirstRow: true });
      return hy;
    };

    // 检查第一页空间
    pageCheck = checkNewPage(pdfDoc, page, y, 54);
    page = pageCheck.page;
    y = pageCheck.y;

    y = drawSectionHeader(page, margin, y, contentWidth, '四、家庭信息', font, headerFontSize);

    // 绘制表头行（带边框）
    y = drawHeaderRow(page, margin, y, familyWidths, familyHeaders, font, fontSize, { isFirstRow: true });
    let familyStartY = y + cellHeight;  // 记录表头起始位置（包含表头）

    // 家庭信息内容
    if (data.family_info && data.family_info.length > 0) {
      data.family_info.forEach((family, index) => {
        // 检查是否需要分页
        const familyResult = checkNewPage(pdfDoc, page, y, cellHeight + 5);
        if (familyResult.isNewPage) {
          // 在分页前绘制当前页的边框
          drawTableOuterBorder(page, margin, familyStartY, y, contentWidth);
          page = familyResult.page;
          y = drawFamilyHeader(page, familyResult.y);
          familyStartY = y + cellHeight;  // 重置起始位置
        } else {
          page = familyResult.page;
          y = familyResult.y;
        }

        const familyValues = [
          family.name || '-',
          family.relation || '-',
          truncateText(family.organ || '-', font, fontSize, familyWidths[2] - 6),
          truncateText(family.work || '-', font, fontSize, familyWidths[3] - 6),
          family.age || '-'
        ];
        y = drawDataRow(page, margin, y, familyWidths, familyValues, font, fontSize);
      });
      // 绘制最后一页的边框
      drawTableOuterBorder(page, margin, familyStartY, y, contentWidth);
    } else {
      y = drawDataRow(page, margin, y, [contentWidth], ['-'], font, fontSize);
      drawTableOuterBorder(page, margin, familyStartY, y, contentWidth);
    }
    y -= 5;

    // ========== 五、工作经历 ==========
    // 工作经历表头（6列）- 公司名称拉长，部门/职位/薪资统一行宽
    const workWidths: number[] = [60, 60, 190, 78, 78, 79]; // 起始、终止、公司、部门、职位、薪资，总和 545
    const workHeaders = ['起始', '终止', '公司名称', '部门', '职位', '薪资'];
    
    // 离职原因行（3行布局）的宽度定义
    // 离职原因标签 = 起始列宽
    // 离职原因内容 = 终止 + 公司名称 + 部门（跨2行合并）
    // 证明人/联系方式标签 = 职位列宽（与职位列对齐）
    // 证明人/联系方式内容 = 薪资列宽
    const reasonLabelWidth = workWidths[0]; // 60
    const reasonContentWidth = workWidths[1] + workWidths[2] + workWidths[3]; // 60+190+78 = 328
    const refLabelWidth = workWidths[4]; // 78（与职位列对齐）
    const refContentWidth = workWidths[5]; // 79

    // 绘制工作经历表头的函数（用于跨页重绘）
    const drawWorkHeader = (p: any, startY: number): number => {
      let hy = drawSectionHeader(p, margin, startY, contentWidth, '五、工作经历（续）', font, headerFontSize);
      hy = drawHeaderRow(p, margin, hy, workWidths, workHeaders, font, fontSize, { isFirstRow: true });
      return hy;
    };

    // 检查第一页空间（需要标题+表头+至少一行数据）
    pageCheck = checkNewPage(pdfDoc, page, y, 72);
    page = pageCheck.page;
    y = pageCheck.y;

    y = drawSectionHeader(page, margin, y, contentWidth, '五、工作经历', font, headerFontSize);

    // 绘制表头行（带边框）
    y = drawHeaderRow(page, margin, y, workWidths, workHeaders, font, fontSize, { isFirstRow: true });
    let workStartY = y + cellHeight;  // 记录表头起始位置（包含表头）

    // 工作经历内容
    if (data.career_detail && data.career_detail.length > 0) {
      data.career_detail.forEach((work, index) => {
        // 每条工作记录需要三行空间，检查是否需要分页
        const workResult = checkNewPage(pdfDoc, page, y, cellHeight * 3 + 10);
        if (workResult.isNewPage) {
          // 在分页前绘制当前页的边框
          drawTableOuterBorder(page, margin, workStartY, y, contentWidth);
          page = workResult.page;
          y = drawWorkHeader(page, workResult.y);
          workStartY = y + cellHeight;  // 重置起始位置
        } else {
          page = workResult.page;
          y = workResult.y;
        }

        // 第1行：起始 | 终止 | 公司名称 | 部门 | 职位 | 薪资
        const workValues = [
          work.start || '-',
          work.end || '-',
          truncateText(work.company || '-', font, fontSize, workWidths[2] - 6),
          truncateText(work.department || '-', font, fontSize, workWidths[3] - 6),
          truncateText(work.job || '-', font, fontSize, workWidths[4] - 6),
          work.salary || '-'
        ];
        y = drawDataRow(page, margin, y, workWidths, workValues, font, fontSize);

        // 第2-3行：离职原因(合并2行) + 证明人/联系方式(拆分2行)
        const row2Y = y;  // 记录第2行的Y位置
        const twoRowHeight = cellHeight * 2;
        
        // 离职原因标签（合并2行，灰色背景）
        page.drawRectangle({
          x: margin,
          y: y - twoRowHeight,
          width: reasonLabelWidth,
          height: twoRowHeight,
          color: rgb(0.9, 0.9, 0.9),
        });
        // 离职原因标签文字（垂直居中）
        const reasonLabelY = y - twoRowHeight / 2 - fontSize / 2 + 1;
        page.drawText('离职原因', {
          x: margin + (reasonLabelWidth - font.widthOfTextAtSize('离职原因', fontSize)) / 2,
          y: reasonLabelY,
          size: fontSize,
          font,
          color: rgb(0, 0, 0),
        });
        
        // 离职原因内容（合并2行，直接使用原文本，自动换行）
        const reasonText = work.reason || '-';
        // 计算垂直居中起始位置
        const reasonContentX = margin + reasonLabelWidth + 4;
        const reasonContentMaxWidth = reasonContentWidth - 8;
        const reasonLineHeight = fontSize + 3;
        
        // 先计算需要多少行
        const reasonLines = calculateTextLines(reasonText, font, fontSize, reasonContentMaxWidth);
        const totalTextHeight = reasonLines * reasonLineHeight;
        // 垂直居中
        const reasonStartY = y - (twoRowHeight - totalTextHeight) / 2 - fontSize;
        
        // 绘制文本
        let currentLine = '';
        let lineIndex = 0;
        for (const char of reasonText) {
          const testLine = currentLine + char;
          if (font.widthOfTextAtSize(testLine, fontSize) > reasonContentMaxWidth) {
            if (currentLine) {
              page.drawText(currentLine, {
                x: reasonContentX,
                y: reasonStartY - lineIndex * reasonLineHeight,
                size: fontSize,
                font,
                color: rgb(0, 0, 0),
              });
              lineIndex++;
            }
            currentLine = char;
          } else {
            currentLine = testLine;
          }
        }
        if (currentLine) {
          page.drawText(currentLine, {
            x: reasonContentX,
            y: reasonStartY - lineIndex * reasonLineHeight,
            size: fontSize,
            font,
            color: rgb(0, 0, 0),
          });
        }
        
        // 第2行：证明人标签和内容
        // 证明人标签（灰色背景）
        drawCell(page, margin + reasonLabelWidth + reasonContentWidth, row2Y, refLabelWidth, cellHeight, '证明人', font, fontSize, { isHeader: true, align: 'center' });
        // 证明人内容
        drawCell(page, margin + reasonLabelWidth + reasonContentWidth + refLabelWidth, row2Y, refContentWidth, cellHeight, truncateText(work.reference_name || '-', font, fontSize, refContentWidth - 6), font, fontSize, { align: 'center' });
        
        // 第3行：联系方式标签和内容
        y -= cellHeight;
        // 联系方式标签（灰色背景）
        drawCell(page, margin + reasonLabelWidth + reasonContentWidth, y, refLabelWidth, cellHeight, '联系方式', font, fontSize, { isHeader: true, align: 'center' });
        // 联系方式内容
        drawCell(page, margin + reasonLabelWidth + reasonContentWidth + refLabelWidth, y, refContentWidth, cellHeight, truncateText(work.reference_contact || '-', font, fontSize, refContentWidth - 6), font, fontSize, { align: 'center' });
        
        // 绘制第2-3行的边框
        // 水平分隔线（第1行和第2行之间）
        page.drawLine({
          start: { x: margin, y: row2Y },
          end: { x: margin + contentWidth, y: row2Y },
          thickness: 0.5,
          color: rgb(0, 0, 0),
        });
        
        // 水平分隔线（第2行和第3行之间，只在证明人/联系方式区域，不穿过离职原因合并单元格）
        page.drawLine({
          start: { x: margin + reasonLabelWidth + reasonContentWidth, y: y + cellHeight },
          end: { x: margin + contentWidth, y: y + cellHeight },
          thickness: 0.5,
          color: rgb(0, 0, 0),
        });
        
        // 垂直分隔线
        // 离职原因标签和内容之间
        page.drawLine({
          start: { x: margin + reasonLabelWidth, y: row2Y },
          end: { x: margin + reasonLabelWidth, y: y - cellHeight },
          thickness: 0.5,
          color: rgb(0, 0, 0),
        });
        // 离职原因内容和证明人/联系方式之间
        page.drawLine({
          start: { x: margin + reasonLabelWidth + reasonContentWidth, y: row2Y },
          end: { x: margin + reasonLabelWidth + reasonContentWidth, y: y - cellHeight },
          thickness: 0.5,
          color: rgb(0, 0, 0),
        });
        // 证明人/联系方式标签和内容之间
        page.drawLine({
          start: { x: margin + reasonLabelWidth + reasonContentWidth + refLabelWidth, y: row2Y },
          end: { x: margin + reasonLabelWidth + reasonContentWidth + refLabelWidth, y: y - cellHeight },
          thickness: 0.5,
          color: rgb(0, 0, 0),
        });
        
        y -= cellHeight;
      });
      // 绘制最后一页的边框
      drawTableOuterBorder(page, margin, workStartY, y, contentWidth);
    } else {
      y = drawDataRow(page, margin, y, [contentWidth], ['-'], font, fontSize);
      drawTableOuterBorder(page, margin, workStartY, y, contentWidth);
    }
    y -= 5;

    // ========== 六、个人特质 ==========
    // 个人特质区域
    const traitLabelWidth = 125;
    const traitContentWidth = contentWidth - traitLabelWidth; // 420
    const traitFields = [
      { label: '性格特点', value: formatValue(data.character) },
      { label: '特长', value: formatValue(data.speciality) },
      { label: '最有价值的项目和自我收获', value: formatValue(data.project_detail) },
      { label: '工作职责理解', value: formatValue(data.job_duty) },
      { label: '职业规划', value: formatValue(data.plan) },
    ];

    // 绘制个人特质标题的函数（用于跨页重绘）
    const drawTraitHeader = (p: any, startY: number): number => {
      return drawSectionHeader(p, margin, startY, contentWidth, '六、个人特质（续）', font, headerFontSize);
    };

    // 检查第一页空间
    pageCheck = checkNewPage(pdfDoc, page, y, 36); // 标题 + 至少一行
    page = pageCheck.page;
    y = pageCheck.y;

    y = drawSectionHeader(page, margin, y, contentWidth, '六、个人特质', font, headerFontSize);
    let traitStartY = y;  // 记录表格起始位置

    // 使用可变高度的多行单元格（函数内部计算高度）
    traitFields.forEach((field, index) => {
      // 检查是否需要分页（预留最大可能空间：5行文字 + 边距）
      const maxHeight = (fontSize + 4) * 5 + 8; // 73
      const traitResult = checkNewPage(pdfDoc, page, y, maxHeight + 10);
      if (traitResult.isNewPage) {
        // 在分页前绘制当前页的边框
        drawTableOuterBorder(page, margin, traitStartY, y, contentWidth);
        page = traitResult.page;
        y = drawTraitHeader(page, traitResult.y);
        traitStartY = y;  // 重置起始位置
      } else {
        page = traitResult.page;
        y = traitResult.y;
      }

      // 直接调用，函数内部使用固定高度并返回新 y 坐标
      const isFirstTraitRow = index === 0;
      const isLastTraitRow = index === traitFields.length - 1;
      y = drawMultilineCell(page, margin, y, traitLabelWidth, traitContentWidth,
        field.label, field.value, font, fontSize, {
          maxHeight,
          isFirstRow: isFirstTraitRow,
          isLastRow: isLastTraitRow
        });
    });

    // 绘制最后一页的边框
    drawTableOuterBorder(page, margin, traitStartY, y, contentWidth);

    y -= 5;

    // ========== 声明 ==========
    // 声明部分已包含在家庭信息模块的空间计算中，这里只需预留声明本身的高度
    pageCheck = checkNewPage(pdfDoc, page, y, 70);
    page = pageCheck.page;
    y = pageCheck.y;

    const declHeight = 60;
    // 边框（使用1pt粗边框，完整长方形）
    page.drawRectangle({
      x: margin,
      y: y - declHeight,
      width: contentWidth,
      height: declHeight,
      borderColor: rgb(0, 0, 0),
      borderWidth: 1,
    });

    // 标题
    page.drawText('声明', {
      x: margin + 4,
      y: y - 12,
      size: headerFontSize,
      font,
      color: rgb(0, 0, 0),
    });

    // 内容
    const declText = '本人已经明白及接受上述之个人资料保障原则。同时，有关本人在求职申请表上所填写之一切均真实及正确。在必要时同意授权上海进化时代营销策划有限公司对上述信息进行核实确认。一旦以上任意陈述被发现不实或本人蓄意隐瞒相关事实，公司有权立即解除劳动关系并不给予任何经济补偿。';
    drawWrappedText(page, declText, margin + 4, y - 20, contentWidth - 8, font, smallFontSize, 11);

    y -= declHeight + 20;

    // 签名
    page.drawText('应聘人签署：', { x: margin, y, size: fontSize, font, color: rgb(0, 0, 0) });

    if (data.signature && data.signature.startsWith('data:image')) {
      try {
        const sigData = data.signature.split(',')[1];
        const sigBytes = Buffer.from(sigData, 'base64');
        const sigImage = await pdfDoc.embedPng(sigBytes);
        
        // 签名 Canvas: 500x80 (6.25:1)，保持比例
        page.drawImage(sigImage, {
          x: margin + 75,
          y: y - 25,
          width: 150,
          height: 24,
        });
      } catch (err) {
        page.drawText('________________', { x: margin + 75, y, size: fontSize, font, color: rgb(0, 0, 0) });
      }
    } else {
      page.drawText('________________', { x: margin + 75, y, size: fontSize, font, color: rgb(0, 0, 0) });
    }

    // 日期
    page.drawText('应聘日期：', { x: PAGE_CONFIG.width - margin - 180, y, size: fontSize, font, color: rgb(0, 0, 0) });

    if (data.signatureDate && data.signatureDate.startsWith('data:image')) {
      try {
        const dateData = data.signatureDate.split(',')[1];
        const dateBytes = Buffer.from(dateData, 'base64');
        const dateImage = await pdfDoc.embedPng(dateBytes);
        
        // 日期 Canvas: 500x60 (8.33:1)，保持比例
        page.drawImage(dateImage, {
          x: PAGE_CONFIG.width - margin - 110,
          y: y - 15,
          width: 125,
          height: 15,
        });
      } catch (err) {
        page.drawText('________________', { x: PAGE_CONFIG.width - margin - 110, y, size: fontSize, font, color: rgb(0, 0, 0) });
      }
    } else {
      page.drawText('________________', { x: PAGE_CONFIG.width - margin - 110, y, size: fontSize, font, color: rgb(0, 0, 0) });
    }

    // ========== 页脚 ==========
    const footer = '招聘系统-EVO | 本登记表由系统自动生成';
    const pages = pdfDoc.getPages();
    pages.forEach((p, i) => {
      const pw = p.getSize().width;
      p.drawText(footer, {
        x: (pw - font.widthOfTextAtSize(footer, smallFontSize)) / 2,
        y: 20,
        size: smallFontSize,
        font,
        color: rgb(0.6, 0.6, 0.6),
      });
      p.drawText(`第 ${i + 1} 页`, {
        x: pw - margin - 40,
        y: 20,
        size: smallFontSize,
        font,
        color: rgb(0.6, 0.6, 0.6),
      });
    });

    // 生成 PDF
    const pdfBytes = await pdfDoc.save();
    const pdfBuffer = Buffer.from(pdfBytes);
    const timestamp = Date.now();
    const sanitizedName = (data.name || 'Unknown').replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_');
    // 限制姓名长度，避免文件名过长（文件系统通常限制255字节）
    const truncatedName = sanitizedName.length > 20 ? sanitizedName.substring(0, 20) : sanitizedName;
    const filename = `Resume_${truncatedName}_${timestamp}.pdf`;

    // 直接返回内存中的 buffer 和文件名，不写入磁盘
    return { buffer: pdfBuffer, filename };
  } catch (error) {
    console.error('生成 PDF 失败:', error);
    throw error;
  }
}

// 发送飞书通知
export async function sendToFeishuWebhook(data: ResumeData, pdfUrl: string): Promise<void> {
  const webhookUrl = process.env.FEISHU_WEBHOOK_URL;
  if (!webhookUrl) {
    throw new Error('FEISHU_WEBHOOK_URL 环境变量未配置');
  }

  const formatVal = (v: string | undefined | null) => (v === undefined || v === null || v === '' ? '无' : v);

  const message = {
    msg_type: 'interactive',
    card: {
      config: { wide_screen_mode: true },
      header: { title: { tag: 'plain_text', content: '📋 新简历提交通知' }, template: 'blue' },
      elements: [
        { tag: 'div', text: { tag: 'lark_md', content: `**【基本信息】**\n**姓名：**${formatVal(data.name)}\n**应聘岗位：**${formatVal(data.post)}\n**性别：**${formatVal(data.sex)} | **出生日期：**${formatVal(data.birthday)}` } },
        { tag: 'hr' },
        { tag: 'div', text: { tag: 'lark_md', content: `**【联系方式】**\n**手机：**${formatVal(data.mobilephone)}\n**邮箱：**${formatVal(data.email)}` } },
        { tag: 'hr' },
        { tag: 'div', text: { tag: 'lark_md', content: `**【应聘信息】**\n**应聘渠道：**${formatVal(data.channel_type)}${data.channel_referrer ? `（推荐人：${formatVal(data.channel_referrer)}）` : ''}\n**岗位性质：**${formatVal(data.job_type)}\n**薪资：**${formatVal(data.current_salary)} / ${formatVal(data.salary_expectation)}` } },
        { tag: 'hr' },
        { tag: 'action', actions: [{ tag: 'button', text: { tag: 'plain_text', content: '📥 下载PDF简历' }, type: 'primary', url: pdfUrl }] },
        { tag: 'note', elements: [{ tag: 'plain_text', content: `提交时间：${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}` }] },
      ],
    },
  };

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message),
    });
    const result = await response.json();
    if (result.code !== 0) {
      console.error('飞书 Webhook 发送失败:', result);
    } else {
      console.log('飞书消息发送成功');
    }
  } catch (err) {
    console.error('飞书通知发送失败:', err);
  }
}
