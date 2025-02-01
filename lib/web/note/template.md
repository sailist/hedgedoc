---
cop: true
file_id: FIL-C-{dateid}-{EID}-{ZZX}
parent_file_id: FIL-C-240929-901068-MDX
title: __title__
major_version: 1
minor_version: 0
patch_version: 0
---

```table
type: 修订记录
| 版本号 | 修订日期      | 作者     | 修订内容 |
| ------ | ------------- | -------- | -------- |
| 1.0    | {modify_date} | {author} | 首次制作 |
```

## 总则

### 目的

- TODO

### 适用范围

- TODO

### 名词定义

- **!名词**：解释

## snippets


### 基本语法

- **加粗**
  - **!非常重要！**
  - **-给予批评！**
  - **=给予表扬！**
- *斜体*
- 代码示例：
  - 注意：代码上下要留空行，否则解析会出错。

```python
for i in range(10):
    print(i)

{
  "yaml": 1
}
```

1. 有序一级标题
2. 有序一级标题
   1. 有序二级标题
   2. 有序二级标题

- 无序一级标题
- 无序一级标题
  - 无序二级标题
  - 无序二级标题


### 公式支持

- 公式支持：
  - $\frac{1}{2}$

$$
\frac{3}{4}
$$


- 下面的公式输入方式不支持：

```
\[
\frac{5}{6}
\]
```

### 引用示例

- 引用示例：
  - 查看 checklist： \site{demo-checklist}
  - 查看 html 表格： \site{demo-html-table}
  - 查看 带引用的普通表格： \site{demo-table}

### 表格示例

- 普通什么内容也没有的表格：

| 列1 | 列2 | 列3 |
| --- | --- | --- |
| 1   | 2   | 3   |


- 普通表格（带引用）：

```table
label: demo-table
caption: 普通表格（caption 为可选）
| 列1 | 列2 | 列3 |
| --- | --- | --- |
| 1   | 2   | 3   |
```

```table
caption: 没有引用有 caption 的表格
| 列1 | 列2 | 列3 |
| --- | --- | --- |
| 1   | 2   | 3   |
```


- 表格列宽自适应：

```table
caption: 表格列宽自适应
| 短列 | 中列             | 长列                                                                             |
| ---- | ---------------- | -------------------------------------------------------------------------------- |
| 1    | 2222222222222222 | 33333333333333333333333333333333333333333333333333333333333333333333333333333333 |
```

- html 表格：

<table>
  <caption>html 表格</caption>
  <label>demo-html-table</label>
  <thead>
    <tr>
      <th colspan="2">列（12）合并</th>
      <th>列3</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td rowspan="2">行（47）合并</td>
      <td>5</td>
      <td>6</td>
    </tr>
    <tr>
      <td>8</td>
      <td>9</td>
    </tr>
    <tr>
      <td>10</td>
      <td colspan="2" rowspan="2">行列（11 12 14 15）合并</td>
    </tr>
    <tr>
      <td>13</td>
    </tr>
    <tr>
      <td>16</td>
      <td>17</td>
      <td>18</td>
    </tr>
  </tbody>
</table>

### Checklist 示例

- Checklist 表格示例：

<table>
  <caption>Checklist</caption>
  <label>demo-checklist</label>
  <thead>
    <tr>
      <th>Cat.</th>
      <th>Check 项目</th>
      <th>Check 方法</th>
      <th>参考值</th>
      <th>Check 结果</th>
      <th>PR & 时间</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td class="Cat.">封面</td>
      <td class="Check 项目">标题位置检查</td>
      <td class="Check 方法">标题是否填入封面正确位置，以便正文页的页眉自动更新为标题名。</td>
      <td class="参考值">是</td>
      <td class="Check 结果">Check 结果</td>
      <td class="PR & 时间"></td>
    </tr>
    <tr>
      <td class="Cat.">封面</td>
      <td class="Check 项目">标题字体检查</td>
      <td class="Check 方法">标题字体是否加粗。</td>
      <td class="参考值">是</td>
      <td class="Check 结果">Check 结果</td>
      <td class="PR & 时间"></td>
    </tr>
    <tr>
      <td class="Cat.">修订记录</td>
      <td class="Check 项目">修订记录内容检查</td>
      <td class="Check 方法">修订记录中，每个版本是否都填写了修订日期、作者及修订内容。</td>
      <td class="参考值">是</td>
      <td class="Check 结果">Check 结果</td>
      <td class="PR & 时间"></td>
    </tr>
    <tr>
      <td class="Cat.">修订记录</td>
      <td class="Check 项目">修订记录中的版本号检查</td>
      <td class="Check 方法">修订记录中，版本号是否都只填2位(A.B)，而没有填3位(A.B.C)。</td>
      <td class="参考值">是</td>
      <td class="Check 结果">Check 结果</td>
      <td class="PR & 时间"></td>
    </tr>
  </tbody>
</table>