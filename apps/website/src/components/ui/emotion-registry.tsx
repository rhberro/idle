"use client";

import createCache from "@emotion/cache";
import { CacheProvider } from "@emotion/react";
import { useServerInsertedHTML } from "next/navigation";
import type { PropsWithChildren } from "react";
import { useState } from "react";

// Required because SiteHeader (an async Server Component) makes this route stream
// via Suspense: without collecting and flushing Emotion's SSR-inserted styles per
// chunk, style insertion order diverges between server and client, producing a
// hydration mismatch (server renders a <style data-emotion="css-global ...">, client
// expects the real element). See Chakra UI's Next.js App Router setup docs.
export function EmotionRegistry(props: PropsWithChildren) {
	const { children } = props;

	const [{ cache, flush }] = useState(function createRegistry() {
		const cache = createCache({ key: "css" });
		cache.compat = true;

		const previousInsert = cache.insert;
		let inserted: string[] = [];

		cache.insert = function (...args) {
			const serialized = args[1];
			if (cache.inserted[serialized.name] === undefined) {
				inserted.push(serialized.name);
			}
			return previousInsert(...args);
		};

		function flush() {
			const previouslyInserted = inserted;
			inserted = [];
			return previouslyInserted;
		}

		return { cache, flush };
	});

	useServerInsertedHTML(function insertEmotionStyles() {
		const names = flush();
		if (names.length === 0) return null;

		const styles = names
			.map(function (name) {
				return cache.inserted[name];
			})
			.join("");

		return (
			<style
				data-emotion={`${cache.key} ${names.join(" ")}`}
				// biome-ignore lint/security/noDangerouslySetInnerHtml: server-collected Emotion CSS, not user input
				dangerouslySetInnerHTML={{ __html: styles }}
			/>
		);
	});

	return <CacheProvider value={cache}>{children}</CacheProvider>;
}
