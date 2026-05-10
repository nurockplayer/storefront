import nextVitals from "eslint-config-next/core-web-vitals";

const config = [
	...nextVitals,
	{
		ignores: [".next/**", "out/**", "build/**", "coverage/**", "test-results/**", "next-env.d.ts"],
	},
];

export default config;
