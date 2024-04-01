import { reactive } from "vue"
import { events } from "./events"

export function useBlockDragger(focusData, lastSelectBlock, data) {
  // 移动坐标信息
  let dragState = {
    startX: 0,
    startY: 0,
    dragging: false, // 默认不是正在拖拽
  }
  let markLine = reactive({
    x: null,
    y: null
  })

  const mousedown = e => {
    const { width: BWidth, height: BHeight } = lastSelectBlock.value

    dragState = {
      dragging: false,
      startX: e.clientX,
      startY: e.clientY,
      // 当前单个选中元素 / 选中多个元素的最后一个元素 b点拖拽前的位置 left 和 top
      startLeft: lastSelectBlock.value.left,
      startTop: lastSelectBlock.value.top,
      /**
       * 场景一：选中一个直接按住拖拽
       * 场景二：选中多个，统一拖拽
       * 
       * 记录每一个选中的位置
       */
      startPos: focusData.value.focusArr.map(({ top, left }) => ({ top, left })),
      lines: (() => {
        const { unFocusArr } = focusData.value // 获取其他未选中的，以它们的位置做辅助线

        /**
         * 横辅助线(计算横线的位置用y来存放)：距离顶部的距离
         * 纵辅助线(计算纵线的位置用x来存放)：距离左侧的距离
         */
        let lines = {x: [], y: []};
        [...unFocusArr,
          // 参照整个容器做参照，做辅助线
          {
            top: 0,
            left: 0,
            width: data.value.container.width,
            height: data.value.container.height
          }
        ].forEach((block) => {
          const { top:ATop, left: ALeft, width: AWidth, height: AHeight } = block
          // 当此元素拖拽到和A元素top一致的时候，要显示这根辅助线，辅助线的位置就是ATop
          //【拿当前选中的元素 和 所有的元素对比】

          // --- 横线辅助线的5种情况
          lines.y.push({ showTop: ATop, top: ATop }) // 顶对顶
          lines.y.push({ showTop: ATop, top: ATop - BHeight }) // 顶对底
          lines.y.push({ showTop: ATop + AHeight / 2, top: ATop + AHeight / 2 - BHeight / 2 }) // 中对中
          lines.y.push({ showTop: ATop + AHeight, top: ATop + BHeight }) // 底对顶
          lines.y.push({ showTop: ATop + AHeight, top: ATop + AHeight - BHeight }) // 底对底

          // ---- 纵向辅助线的5种情况
          lines.x.push({ showLeft: ALeft, left: ALeft }) // 左对左
          lines.x.push({ showLeft: ALeft + AWidth, left: ALeft + AWidth }) // 右对左
          lines.x.push({ showLeft: ALeft + AWidth / 2, left: ALeft + AWidth / 2 - BWidth / 2 }) // 中对中
          lines.x.push({ showLeft: ALeft + AWidth, left: ALeft + AWidth - BWidth }) // 右对右
          lines.x.push({ showLeft: ALeft, left: ALeft - BWidth }) // 左对右
        })
        return lines
      })()
    }
    document.addEventListener('mousemove', mousemove)
    document.addEventListener('mouseup', mouseup)
  }
  const mousemove = e => {
    let { clientX: moveX, clientY: moveY } = e

    if(!dragState.dragging) {
      dragState.dragging = true;
      events.emit("start"); // 触发事件就会记住拖拽前的位置
    }

    // 计算当前元素最新的left 和 top 去线里面找，找到显示线
    // 最新的left = 鼠标移动后 - 鼠标移动前 + startLeft
    // 最新的top = 鼠标移动后 - 鼠标移动前 + startTop
    let left = moveX - dragState.startX + dragState.startLeft
    let top = moveY - dragState.startY + dragState.startTop

    // 先计算横线 距离参照物元素还有5像素的时候 就显示这根线
    let y = null;
    let x = null;
    const dis = 5 // 如果小于5说明接近了

    for(let i = 0; i < dragState.lines.y.length; i++) {
      const { top: t, showTop: s } = dragState.lines.y[i]; // 获取每一根线
      if(Math.abs(t - top) < dis) {
        y = s; // 线要显示的位置
        /**
         * 元素距离顶部的距离：dragState.startY
         * 元素距离容器的距离：dragState.startTop
         * 容器距离顶部的距离：dragState.startY - dragState.startTop
         * 
         * 最新moveY = 容器距离顶部的距离 + 目标的高度
         */
        moveY = dragState.startY - dragState.startTop + t; 
        // 元素吸附效果：实现快速和这个元素贴在一起
        break; // 找到一根线跳出循环
      }
    }

    // 计算纵线 距离参照物元素还有5像素的时候 就显示这根线
    for(let i = 0; i < dragState.lines.x.length; i++) {
      const { left: l, showLeft: s } = dragState.lines.x[i]; // 获取每一根线
      if(Math.abs(l - left) < dis) {
        x = s; // 线要显示的位置
        /**
         * 元素距离左部的距离：dragState.startX
         * 元素距离容器的距离：dragState.startLeft
         * 容器距离左部的距离：dragState.startX - dragState.startLeft
         * 
         * 最新moveX = 容器距离左部的距离 + 目标的left
         */
        moveX = dragState.startX - dragState.startLeft + l; 
        // 元素吸附效果：实现快速和这个元素贴在一起
        break; // 找到一根线跳出循环
      }
    }

    // markLine 是一个响应式数据 x,y更新了会导致视图更新
    markLine.x = x;
    markLine.y = y;

    // 移动距离 =  移动位置 - 组件开始位置
    let durX = moveX - dragState.startX // 拖拽前后的距离
    let durY = moveY - dragState.startY
    // 当前移动位置 = 选中位置 + 移动距离
    focusData.value.focusArr.forEach((block, idx) => {
      block.top = dragState.startPos[idx].top + durY
      block.left = dragState.startPos[idx].left + durX
    })
  }
  const mouseup = e => {
    document.removeEventListener('mousemove', mousemove)
    document.removeEventListener('mouseup', mouseup)
    // 鼠标抬起清除辅助线
    markLine.x = null;
    markLine.y = null;

    // 如果只是点击就不会触发
    if(dragState.dragging) {
      events.emit("end");
    }
  }

  return {
    mousedown,
    mousemove,
    mouseup,
    markLine
  }
}
