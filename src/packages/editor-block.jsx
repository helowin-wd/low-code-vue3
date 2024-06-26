import { computed, defineComponent, inject, onMounted, ref } from "vue";

export default defineComponent({
  props: { 
    block: { type: Object }
  },
  setup(props) {
    const blockStyles = computed(() => ({
      top: `${props.block.top}px`,
      left: `${props.block.left}px`,
      zIndex: `${props.block.zIndex}`,
    }))

    const config = inject('config')
    // 通过block的key属性直接获取对应的组件
    const component = config.componentMap[props.block.key]
    const RenderComponent = component.render()
    const blockRef = ref(null)
    onMounted(() => {
      let { offsetWidth, offsetHeight } = blockRef.value
      // 说明是拖拽松手的时候才渲染的，其他的默认渲染到页面上的内容不需要居中显示
      if (props.block.alignCenter) {
        props.block.left = props.block.left - offsetWidth / 2
        props.block.top = props.block.top - offsetHeight / 2
        props.block.alignCenter = false // 让渲染后的结果才能居中
      }
      // 添加元素宽高，用于计算元素辅助线的位置
      props.block.width = offsetWidth
      props.block.height = offsetHeight
    })

    return () => (
      <div class="editor-block" style={blockStyles.value} ref={blockRef}>
        {RenderComponent}
      </div>
    )
  }
})