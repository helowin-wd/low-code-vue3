import { computed, defineComponent, inject } from 'vue'
import './editor.scss'
import editorBlock from './editor-block'

export default defineComponent({
  props: {
    modelValue: { type: Object }
  },
  setup(props) {
    const data = computed({
      get() {
        return props.modelValue
      }
    })

    const containerStyle = computed(() => ({
      width: data.value.container.width + 'px',
      height: data.value.container.height + 'px'
    }))

    const config = inject('config')

    return () => (
      <div class="editor">
        <div class="editor-left">
          {config.componentList.map(comp => (
            <div class="editor-left-item">
              <span>{comp.label}</span>
              <div>{comp.preview()}</div>
            </div>
          ))}
        </div>
        <div class="editor-top">菜单栏</div>
        <div class="editor-right">属性控制栏</div>
        <div class="editor-container">
          <div class="editor-container-canvas">
            <div class="editor-container-canvas__content" style={containerStyle.value}>
              {data.value.blocks.map(block => (
                <editorBlock block={block}></editorBlock>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }
})
