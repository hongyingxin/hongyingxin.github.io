# BEM命名规范

BEM规范是一个CSS命名规范，其全称是Block（块）、Element（元素）、Modifier（修饰符），旨在提高代码的可读性、可维护性和可复用性。

由Yandex团队提出的一种前端CSS命名方法论。它通过一种结构化的命名方式来组织CSS，使得开发者可以通过类名快速理解组件及其各部分之间的关系。 

## 规范组成

- Block（块）：代表一个独立的、具有语义的页面组件，例如`header`、`footer`、`sidebar`、`content`等。
- Element（元素）：Block的子部分，是组成Block的更小单元，其命名通过双下划线`__`与Block连接，例如`header__logo`、`header__nav`、`footer__copyright`等。
- Modifier（修饰符）：用来描述Block或Element的状态、变体、外观，其命名通过双连字符`--`与Block或Element连接，例如`header--active`、`header__nav--open`、`footer__copyright--small`等。

## 命名规则

- 命名层级：BEM不考虑父子层级，只关注组件本身的结构
- 连接符：使用双下划线`__`连接Block和Element，使用双连字符`--`连接Modifier和Block或Element
```css
.block {}

.block__element {}

.block--modifier {}

.block__element--modifier {}
```
- kebab-case：块、元素、修饰符的名称中，多个单词之间使用连字符`-`连接
```css
.sub-block {}

.sub-block__element {}

.sub-block__element--modifier {}

.sub-block__element-block--modifier {}

```

## 与其他命名规范的对比

BEM的关键是，可以获得更多的描述和更加清晰的结构，从其名字可以知道某个标记的含义。于是，通过查看 HTML 代码中的 class 属性，就能知道元素之间的关联。

常规的命名规范：

```html
<div class="article">
    <div class="body">
        <button class="button-primary"></button>
        <button class="button-success"></button>
    </div>
</div>
```

这种写法从 DOM 结构和类命名上可以了解每个元素的意义，但无法明确其真实的层级关系。在 css 定义时，也必须依靠层级选择器来限定约束作用域，以避免跨组件的样式污染。

使用BEM命名规范：

```html
<div class="article">
    <div class="article__body">
        <button class="article__button article__button--primary"></button>
        <button class="article__button article__button--success"></button>
    </div>
</div>
```

这种写法从 DOM 结构和类命名上可以了解每个元素的意义，并且可以明确其真实的层级关系。在 css 定义时，可以直接使用类名来定义样式，避免了层级选择器的使用。

## BEM的槽点

BEM虽然明确层级关系，但是也有一些槽点：例如命名方式长而难看，书写不优雅。

但是我们应该客观看待。而且我们可以通过使用`scss/less`的预处理语言嵌套选择器来解决这个问题。

```css
.article {
    max-width: 1200px;
    &__body {
        padding: 20px;
    }
    &__button {
        padding: 5px 8px;
        &--primary {background: blue;}
        &--success {background: green;}
    }
}
```

## 注意点

- BEM只允许一层Element嵌套，不要嵌套多层Element。

```css
/* ❌ 错误：不能嵌套 Element */
.card__header__title

/* ✅ 正确：扁平化结构 */
.card__header
.card__title
```

- 由于Block与Element使用双下划线`__`连接，所以元素名称要避免使用单下划线`_`，而是使用kebab-case即连字符`-`连接。

```css
/* ❌ 错误：使用单下划线 */
.card_title

/* ✅ 正确：使用连字符 */
.card-title
```

## 实战

这里以项目组的一个活动为例，这个页面的css存在一些问题，例如：

**不一致的命名风格**

```css
.MagicLamp-banner      // kebab-case
.Time-box             // 首字母大写 + kebab-case  
.Time_ar              // 下划线分隔
.block_box            // 下划线分隔
.MagicLamp-gift-conten // 拼写错误，应该是 content
.conten2              // 拼写错误 + 数字后缀
```

**类名语义化不足**

```css
.titleIn { }          // 不明确，应该是 .title--indonesian
.titlePt { }          // 不明确，应该是 .title--portuguese  
.conten2 { }          // 数字后缀，应该是 .content--secondary
.activate { }         // 应该是 .active 或 .is-active
```

我们使用BEM命名规范进行改造：

```css

// 改进后的命名
.magic-lamp { }
.magic-lamp__banner { }
.magic-lamp__timer { }
.magic-lamp__timer--arabic { }
.magic-lamp__gift-content { }
.magic-lamp__gift-content--secondary { }
.magic-lamp__tab { }
.magic-lamp__tab--active { }

// 改进语言相关的类名
.magic-lamp__title--indonesian { }
.magic-lamp__title--portuguese { }
.magic-lamp__timer--rtl { }  // 右到左语言
```

## 总结

BEM的优势：

- 清晰的层级关系：一眼就能看出组件结构
- 避免样式冲突：每个类名都是唯一的
- 便于维护：修改某个组件不会影响其他组件
- 团队协作友好：统一的命名规范

你可以根据自己项目的实际情况选择。