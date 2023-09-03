import type { AppProps } from "next/app";

import Head from "next/head";
import { useEffect } from "react";

import "../styles/index.css";

function MyApp({ Component, pageProps }: AppProps) {
  useEffect(() => {
    window.addEventListener("online", () => {
      const rep = window.rep;
    });
  }, []);
  return (
    <>
      <Head>
        <title>Jira sucks and so do you</title>
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <link
          rel="icon"
          type="image/png"
          href="/static/replicache-logo-96.png"
        />
      </Head>
      <Component {...pageProps} />
    </>
  );
}

export default MyApp;
