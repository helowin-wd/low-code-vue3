import { computed, defineComponent, inject, ref } from 'vue'
import './editor.scss'
import EditorBlock from './editor-block'
import deepcopy from 'deepcopy'
import { useMenuDragger } from './useMenuDragger'
import { useFocus } from './useFocus'
import { useBlockDragger } from './useBlockDragger'

export default defineComponent({
  props: {
    modelValue: { type: Object }
  },
  emits: ["update:modelValue"],
  setup(props, ctx) {
    const data = computed({
      get() {
        return props.modelValue
      },
      set(newVal) {
        ctx.emit("update:modelValue", deepcopy(newVal))
      }
    })

    const containerStyle = computed(() => ({
      width: data.value.container.width + 'px',
      height: data.value.container.height + 'px'
    }))

    const config = inject('config')
    const containerRef = ref(null)
    // 1. 实现菜单的拖拽功能，组件渲染功能
    const {dragStart, dragEnd } = useMenuDragger(containerRef, data)
    // 3. 实现获取焦点 选中后可能就进行拖拽了
    const { containerMouseDown, onMousedown, focusData } = useFocus(data, (e) => {
      // 【注意】回调函数，最后执行 
      mousedown(e) // 选中了哪些
    })
    // 2. 实现组件拖拽
    const { mousedown } = useBlockDragger(focusData)

    return () => (
      <div class="editor">
        <div class="editor-left">
          {config.componentList.map(comp => (
            <div 
              class="editor-left-item" 
              draggable
              onDragstart={ e => dragStart(e, comp)}
              onDragend={ e => dragEnd(e, comp)}
            >
              <span>{comp.label}</span>
              <div>{comp.preview()}</div>
            </div>
          ))}
        </div>
        <div class="editor-top">菜单栏</div>
        <div class="editor-right">属性控制栏</div>
        <div class="editor-container">
          <div class="editor-container-canvas">
            <div 
              class="editor-container-canvas__content" 
              style={containerStyle.value} 
              ref={containerRef}
              onMousedown={containerMouseDown}
            >
              {data.value.blocks.map(block => (
                <EditorBlock 
                class={block.focus ? "editor-block-focus" : ""}
                block={block}
                onMousedown={(e) => onMousedown(e, block)}
                ></EditorBlock>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }
})
