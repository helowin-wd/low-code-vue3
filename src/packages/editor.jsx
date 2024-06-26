import { computed, defineComponent, inject, ref } from 'vue'
import './editor.scss'
import EditorBlock from './editor-block'
import deepcopy from 'deepcopy'
import { useMenuDragger } from './useMenuDragger'
import { useFocus } from './useFocus'
import { useBlockDragger } from './useBlockDragger'
import { useCommand } from './useCommand'
import { $dialog } from '@/components/Dialog'
import { $dropdown, DropdownItem } from '@/components/Dropdown'
import { ElButton } from 'element-plus'

export default defineComponent({
  props: {
    // vue3 绑定数据使用 modelValue
    modelValue: { type: Object }
  },
  emits: ['update:modelValue'],
  setup(props, ctx) {
    // 预览的时候 内容不能再操作了 可以点击 输入内容 方便看效果
    const previewRef = ref(false)
    // 判断是否是编辑状态
    const editorRef = ref(true)

    const data = computed({
      get() {
        return props.modelValue
      },
      set(newVal) {
        ctx.emit('update:modelValue', deepcopy(newVal))
      }
    })
    // 内容区域尺寸
    const containerStyle = computed(() => ({
      width: data.value.container.width + 'px',
      height: data.value.container.height + 'px'
    }))
    // 消费数据，根据config找到对应的组件进行渲染
    const config = inject('config')

    const containerRef = ref(null)
    // 1. 实现菜单的拖拽功能，组件渲染功能
    const { dragStart, dragEnd } = useMenuDragger(containerRef, data)
    // 3. 实现获取焦点 选中后可能就进行拖拽了
    const { containerMouseDown, onMousedown, focusData, lastSelectBlock, clearBlockFocus } = useFocus(data, previewRef, e => {
      // 【注意】回调函数，最后执行
      mousedown(e) // 选中了哪些, 获取焦点后进行拖拽
    })
    // 2. 实现组件拖拽
    const { mousedown, markLine } = useBlockDragger(focusData, lastSelectBlock, data)

    // 按钮工具栏
    const { commands } = useCommand(data, focusData)
    const buttons = [
      { label: '撤销', icon: '', handler: () => commands.undo() },
      { label: '重做', icon: '', handler: () => commands.redo() },
      {
        label: '导出',
        icon: '',
        handler: () => {
          $dialog({
            title: '导出json使用',
            content: JSON.stringify(data.value),
            footer: false
          })
        }
      },
      {
        label: '导入',
        icon: '',
        handler: () => {
          $dialog({
            title: '导入json使用',
            content: '',
            footer: true,
            onConfirm(text) {
              // data.value = JSON.parse(text); // 这样去更改无法保留历史记录
              commands.updateContainer(JSON.parse(text))
            }
          })
        }
      },
      { label: '置顶', icon: '', handler: () => commands.placeTop() },
      { label: '置底', icon: '', handler: () => commands.placeBottom() },
      { label: '删除', icon: '', handler: () => commands.delete() },
      {
        label: () => (previewRef.value ? '编辑' : '预览'),
        icon: previewRef.value ? 'edit' : 'pre',
        handler: () => {
          previewRef.value = !previewRef.value
          clearBlockFocus()
        }
      },
      {
        label: '关闭',
        icon: 'icon-close',
        handler: () => {
          editorRef.value = false
          clearBlockFocus()
        }
      }
    ]

    const onContextMenuBlock = (e, block) => {
      e.preventDefault()
      $dropdown({
        el: e.target, // 以哪个元素为准产生一个dropdown
        content: () => {
          return (
            <>
              <DropdownItem label="删除" icon="icon-delete" onClick={() => commands.delete()}></DropdownItem>
              <DropdownItem label="置顶" icon="icon-place-top" onClick={() => commands.placeTop()}></DropdownItem>
              <DropdownItem label="置底" icon="icon-place-bottom" onClick={() => commands.placeBottom()}></DropdownItem>
              <DropdownItem
                label="查看"
                icon="icon-browse"
                onClick={() => {
                  $dialog({
                    title: '查看节点数据',
                    content: JSON.stringify(block)
                  })
                }}
              ></DropdownItem>
              <DropdownItem
                label="导入"
                icon="icon-import"
                onClick={() => {
                  $dialog({
                    title: '查看节点数据',
                    content: '',
                    footer: true,
                    onConfirm(text) {
                      text = JSON.parse(text)
                      console.log("text", text)
                      commands.updateBlock(text, block)
                    }
                  })
                }}
              ></DropdownItem>
            </>
          )
        }
      })
    }

    return () =>
      !editorRef.value ? (
        <>
          <div class="editor-container-canvas__content" style={{ ...containerStyle.value, margin: 0 }}>
            {data.value.blocks.map((block, index) => (
              <EditorBlock class="editor-block-preview" block={block}></EditorBlock>
            ))}
          </div>
          <div>
            <ElButton type="primary" onClick={() => (editorRef.value = true)}>
              继续编辑
            </ElButton>
          </div>
        </>
      ) : (
        <div class="editor">
          <div class="editor-left">
            {/* 根据注册列表 渲染对应的内容 可以实现h5的拖拽 */}
            {config.componentList.map(comp => (
              <div class="editor-left-item" draggable onDragstart={e => dragStart(e, comp)} onDragend={e => dragEnd(e, comp)}>
                <span>{comp.label}</span>
                <div>{comp.preview()}</div>
              </div>
            ))}
          </div>
          <div class="editor-top">
            {buttons.map((btn, idx) => {
              const icon = typeof btn.icon === 'function' ? btn.icon() : btn.icon
              const label = typeof btn.label === 'function' ? btn.label() : btn.label

              return (
                <div class="editor-top-button" onClick={btn.handler}>
                  <i class={icon}></i>
                  <span>{label}</span>
                </div>
              )
            })}
          </div>
          <div class="editor-right">属性控制栏</div>
          <div class="editor-container">
            <div class="editor-container-canvas">
              <div class="editor-container-canvas__content" style={containerStyle.value} ref={containerRef} onMousedown={containerMouseDown}>
                {data.value.blocks.map((block, index) => (
                  <EditorBlock
                    class={{
                      'editor-block-focus': block.focus,
                      'editor-block-preview': previewRef.value
                    }}
                    block={block}
                    onMousedown={e => onMousedown(e, block, index)}
                    onContextmenu={e => onContextMenuBlock(e, block)}
                  ></EditorBlock>
                ))}
                {/* 辅助线 */}
                {markLine.x !== null && <div class="line-x" style={{ left: markLine.x + 'px' }}></div>}
                {markLine.y !== null && <div class="line-y" style={{ top: markLine.y + 'px' }}></div>}
              </div>
            </div>
          </div>
        </div>
      )
  }
})
