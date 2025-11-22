import './App.css'
import { AuthButton } from './components/AuthButton'
import { Wallet } from './components/Wallet'

function App() {
  return (
    <main className="page">
      <header className="hero">
        <div className="hero-content">
          <p className="eyebrow">Base Mini App Showcase</p>
          <h1>Base Mini App + Stellar Crossmint Smart Account</h1>
          <p className="subtitle">
            This repository demonstrates how to create a Base mini app that controls a Stellar Crossmint smart account.
            Learn how to integrate Base's mini app framework with Crossmint's wallet SDK to build powerful
            on-chain applications on the Stellar network.
          </p>
          <div className="features">
            <div className="feature-item">
              <span className="feature-icon">📱</span>
              <div>
                <strong>Base Mini App</strong>
                <p>Built with Base's mini app framework for seamless Farcaster integration</p>
              </div>
            </div>
            <div className="feature-item">
              <span className="feature-icon">⭐</span>
              <div>
                <strong>Stellar Smart Account</strong>
                <p>Control Crossmint smart accounts on the Stellar network</p>
              </div>
            </div>
            <div className="feature-item">
              <span className="feature-icon">🔐</span>
              <div>
                <strong>Multiple Auth Methods</strong>
                <p>Email, Google, Twitter, Farcaster, or Web3 wallets</p>
              </div>
            </div>
            <div className="feature-item">
              <span className="feature-icon">⚡</span>
              <div>
                <strong>Real-time Balances</strong>
                <p>View your Stellar smart account balance and assets in real-time</p>
              </div>
            </div>
          </div>
        </div>
        <div className="wallet-section">
          <AuthButton />
          <Wallet />
        </div>
      </header>

      <section className="info-section">
        <h2>How it works</h2>
        <ol className="steps-list">
          <li>
            <strong>Base Mini App Integration</strong> - This app is wrapped as a Base mini app using the Farcaster Mini App SDK
          </li>
          <li>
            <strong>Click "Login"</strong> to authenticate using your preferred method (email, social, or Web3)
          </li>
          <li>
            <strong>Stellar Smart Account Creation</strong> - A Crossmint smart account is created automatically on the Stellar network when you first log in
          </li>
          <li>
            <strong>Control Your Smart Account</strong> - View your Stellar smart account address and real-time balance below
          </li>
          <li>
            <strong>Real-time Updates</strong> - Balances update automatically every 10 seconds to show your latest Stellar assets
          </li>
        </ol>
      </section>

      <footer>
        <p>
          Built with{' '}
          <a href="https://docs.base.org/mini-apps" target="_blank" rel="noreferrer">
            Base Mini Apps
          </a>
          {' '}·{' '}
          <a href="https://docs.crossmint.com/wallets/quickstarts/react" target="_blank" rel="noreferrer">
            Crossmint Wallets SDK
          </a>
          {' '}· Powered by{' '}
          <a href="https://base.org" target="_blank" rel="noreferrer">
            Base
          </a>
          {' '}and{' '}
          <a href="https://www.crossmint.com" target="_blank" rel="noreferrer">
            Crossmint
          </a>
        </p>
      </footer>
    </main>
  )
}

export default App
