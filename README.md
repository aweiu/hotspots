# hotspots.js
简单的全功能框选工具，一般用于图片的热区选择和加载
# 用法
目前只有简单的框选，获取相对选区，加载选区的功能。您可以直接看index.html源码，注释都比较详细

**注意：**
*容器的position属性需要显示设置为非static(relative,absolute,fixed...)，以便于选框的相对定位
*插件初始化时便对容器的大小做了缓存，所以容器的大小不能随意变更，一旦变更会导致选区异常

[在线Demo](https://htmlpreview.github.io/?https://github.com/aweiu/hotspots/blob/master/index.html)

![image](https://github.com/aweiu/hotspots/raw/master/demo.png)

