import { computed, defineComponent, inject } from "vue";

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

    return () => (
      <div class="editor-block" style={blockStyles.value}>
        {RenderComponent}
      </div>
    )
  }
})