import { Capacitor, registerPlugin } from '@capacitor/core'

interface WidgetBridgePlugin {
  update(opts: { total: number; taken: number; message?: string }): Promise<void>
  refresh(): Promise<void>
}

const WidgetBridge = registerPlugin<WidgetBridgePlugin>('WidgetBridge')

export async function updateWidget(opts: { total: number; taken: number; message?: string }): Promise<void> {
  if (Capacitor.getPlatform() !== 'android') return
  try {
    await WidgetBridge.update(opts)
  } catch {
    // ウィジェット未配置 or ブリッジ未登録の環境では黙ってスキップ
  }
}
