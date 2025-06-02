import Script from 'next/script';
import '@/styles/globals.css';
import type { AppProps } from 'next/app';
import { NextUIProvider } from '@nextui-org/react';
import Head from 'next/head';
import { useEffect } from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import io from 'socket.io-client';

// Initialize socket connection
let socket: any;

export function getSocket() {
  return socket;
}

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    // Initialize socket connection
    if (!socket) {
      socket = io({
        path: '/api/socket',
        addTrailingSlash: false
      });

      socket.on('connect', () => {
        console.log('Socket connected');
      });

      socket.on('error', (error: any) => {
        console.error('Socket error:', error);
      });
    }

    // Service worker registration
    if (
      process.env.NODE_ENV === 'production' &&
      'serviceWorker' in navigator &&
      window.self === window.top
    ) {
      navigator.serviceWorker
        .register('/service-worker.js')
        .then(reg => console.log('✅ Service Worker registered:', reg))
        .catch(err => console.error('❌ Service Worker registration failed:', err));
    }

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, []);

  return (
    <>
      <Head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover"
        />
        <meta name="theme-color" content="#132030" />
        <meta name="apple-mobile-web-app-status-bar-style" content="#132030" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="color-scheme" content="dark light" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Almarai:wght@300;400;700&display=swap"
          rel="stylesheet"
        />
      </Head>

      <NextUIProvider>
        <div className="particles"></div>
        <div className="gradient-overlay"></div>
        <div className="glass-root">
          <Component {...pageProps} />
        </div>
      </NextUIProvider>
      
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />
    </>
  );
}