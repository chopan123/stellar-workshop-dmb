import './App.css'
import { AuthButton } from './components/AuthButton'
import { Wallet } from './components/Wallet'

function App() {
  return (
    <main className="page">
      <header className="hero">
        <div className="hero-content">
          <p className="eyebrow">Crossmint Wallet Demo</p>
          <h1>Crossmint Wallet Integration</h1>
          <p className="subtitle">
            This demonstration showcases Crossmint's wallet capabilities for creating and managing
            blockchain wallets. Experience seamless authentication, automatic wallet creation, and
            real-time balance tracking on the Stellar network.
          </p>
          <div className="features">
            <div className="feature-item">
              <span className="feature-icon">🔐</span>
              <div>
                <strong>Multiple Auth Methods</strong>
                <p>Email, Google, Twitter, Farcaster, or Web3 wallets</p>
              </div>
            </div>
            <div className="feature-item">
              <span className="feature-icon">💼</span>
              <div>
                <strong>Automatic Wallet Creation</strong>
                <p>Wallets are created automatically on first login</p>
              </div>
            </div>
            <div className="feature-item">
              <span className="feature-icon">⚡</span>
              <div>
                <strong>Real-time Balances</strong>
                <p>View your wallet balance and assets in real-time</p>
              </div>
            </div>
            <div className="feature-item">
              <span className="feature-icon">🌐</span>
              <div>
                <strong>Chain Agnostic</strong>
                <p>Works across Solana, EVM chains, Stellar, and more</p>
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
            <strong>Click "Login"</strong> to authenticate using your preferred method (email, social, or Web3)
          </li>
          <li>
            <strong>Wallet is created automatically</strong> on the Stellar network when you first log in
          </li>
          <li>
            <strong>View your wallet address</strong> and real-time balance below
          </li>
          <li>
            <strong>Balances update automatically</strong> every 10 seconds to show your latest assets
          </li>
        </ol>
      </section>

      <footer>
        <p>
          Built with{' '}
          <a href="https://docs.crossmint.com/wallets/quickstarts/react" target="_blank" rel="noreferrer">
            Crossmint Wallets SDK
          </a>
          {' '}· Powered by{' '}
          <a href="https://www.crossmint.com" target="_blank" rel="noreferrer">
            Crossmint
          </a>
        </p>
      </footer>
    </main>
  )
}

export default App
