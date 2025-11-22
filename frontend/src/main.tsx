import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { Providers } from './Providers.tsx'

// Initialize Base Mini App SDK (gracefully handle if not in miniapp context)
async function initializeMiniApp() {
  try {
    const { init, sdk } = await import('@farcaster/miniapp-sdk')
    await init()
    
    // Signal that the app is ready to be displayed
    // Only call this if we're actually in a miniapp context
    if (sdk?.actions?.ready) {
      await sdk.actions.ready()
    }
  } catch (error) {
    // If SDK fails to load or initialize, continue anyway
    // This allows the app to work in regular browser context
    console.log('MiniApp SDK not available, running in regular browser mode:', error)
  }
}

// Render the app immediately
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Providers>
      <App />
    </Providers>
  </StrictMode>,
)

// Initialize miniapp SDK in the background
initializeMiniApp()
