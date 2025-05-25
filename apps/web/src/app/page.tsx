import Image from "next/image";

export default function Home() {
  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
        <div className="text-center sm:text-left">
          <h1 className="text-6xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            VOISSS
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-2">
            Decentralized Voice Recording Platform
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Built exclusively for Starknet Reignite Hackathon
          </p>
        </div>

        <div className="text-center sm:text-left max-w-2xl">
          <p className="text-lg mb-6 text-gray-700 dark:text-gray-300">
            Transform how you capture, organize, and share audio content with
            our comprehensive dual-platform solution featuring both mobile and
            web applications on Starknet.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <h3 className="font-semibold mb-2 text-blue-600 dark:text-blue-400">
                📱 Mobile App
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                React Native + Starknet.dart for seamless mobile voice recording
              </p>
            </div>
            <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <h3 className="font-semibold mb-2 text-purple-600 dark:text-purple-400">
                🌐 Decentralised App
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Next.js + Starknet for community features and decentralized
                storage
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-4 items-center flex-col sm:flex-row">
          <a
            className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-blue-600 text-white gap-2 hover:bg-blue-700 font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 sm:w-auto"
            href="https://t.me/+jG3_jEJF8YFmOTY1"
            target="_blank"
            rel="noopener noreferrer"
          >
            🚀 Join Hackathon
          </a>
          <a
            className="rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 w-full sm:w-auto"
            href="https://starknetdart.dev/"
            target="_blank"
            rel="noopener noreferrer"
          >
            📚 Starknet.dart Docs
          </a>
        </div>
      </main>
      <footer className="row-start-3 flex gap-[24px] flex-wrap items-center justify-center">
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://starknetdart.dev/"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/file.svg"
            alt="File icon"
            width={16}
            height={16}
          />
          Starknet.dart
        </a>
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://tinyurl.com/4zk6ru24"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/window.svg"
            alt="Window icon"
            width={16}
            height={16}
          />
          Workshop Calendar
        </a>
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://t.me/+jG3_jEJF8YFmOTY1"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/globe.svg"
            alt="Globe icon"
            width={16}
            height={16}
          />
          Hackathon TG Group →
        </a>
      </footer>
    </div>
  );
}
