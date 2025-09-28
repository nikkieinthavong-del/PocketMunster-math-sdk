#!/usr/bin/env node

/**
 * Automated test script for PocketMon Genesis embed functionality
 * Validates embed.js bundle and ensures all features work correctly
 */

import { readFileSync, existsSync, statSync } from "node:fs";
import vm from "node:vm";
import { resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = resolve(__filename, "..");

const DIST_WEB_DIR = resolve(__dirname, "../dist-web");
const EMBED_JS_PATH = resolve(DIST_WEB_DIR, "embed.js");
const EMBED_CONTAINER_PATH = resolve(DIST_WEB_DIR, "embed.container.js");

class EmbedTester {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      tests: [],
    };
  }

  test(name, condition, details = "") {
    const passed = Boolean(condition);
    this.results.tests.push({
      name,
      passed,
      details,
    });

    if (passed) {
      this.results.passed++;
      console.log(`✅ ${name}`);
    } else {
      this.results.failed++;
      console.log(`❌ ${name}: ${details}`);
    }

    return passed;
  }

  async run() {
    console.log("🧪 Running PocketMon Genesis Embed Tests...\n");
    // Classic embed.js validations
    this.section("Classic embed.js");
    this.assertFile("embed.js present", EMBED_JS_PATH);
    if (existsSync(EMBED_JS_PATH)) {
      const fileSize = this.getFileSize(EMBED_JS_PATH);
      this.test(
        "embed.js size ok",
        fileSize > 10000 && fileSize < 60000,
        `size=${fileSize} bytes (expected: 10KB-60KB)`
      );
      const embedContent = readFileSync(EMBED_JS_PATH, "utf8");
      this.test(
        "namespace present",
        embedContent.includes("PocketMunsters"),
        "Missing PocketMunsters"
      );
      this.test("init() present", embedContent.includes("function init"), "Missing init");
      this.test("Animator present", embedContent.includes("class Animator"), "Missing Animator");
      this.test("sfx present", embedContent.includes("sfx"), "Missing sfx");
      this.test(
        "format helpers present",
        embedContent.includes("formatCurrencyMicro"),
        "Missing formatCurrencyMicro"
      );
      this.test("symbols registry present", embedContent.includes("registry"), "Missing registry");
      this.test("syntax valid", this.validateSyntax(embedContent), "Syntax error");
      const versionMatch = embedContent.match(/version[:=]\s*['"]([^'"]+)['"]/);
      this.test(
        "version info present",
        !!versionMatch && versionMatch[1].length > 0,
        versionMatch ? `Version: ${versionMatch[1]}` : "No version string"
      );
    }

    // Container embed.container.js validations
    this.section("Container embed.container.js");
    this.assertFile("embed.container.js present", EMBED_CONTAINER_PATH);
    if (existsSync(EMBED_CONTAINER_PATH)) {
      const cSize = this.getFileSize(EMBED_CONTAINER_PATH);
      this.test(
        "embed.container.js size ok",
        cSize > 20000 && cSize < 220000,
        `size=${cSize} bytes (expected: 20KB-220KB)`
      );
      const cContent = readFileSync(EMBED_CONTAINER_PATH, "utf8");
      this.test("mount() present", /function\s+mount\s*\(/.test(cContent), "Missing mount()");
      this.test("Shadow DOM usage", cContent.includes("attachShadow"), "Missing attachShadow");
      this.test(
        "asset resolver present",
        cContent.includes("function resolveAsset"),
        "Missing resolveAsset"
      );
      this.test(
        "symbols use resolver",
        /return\s+resolveAsset\(/.test(cContent),
        "Paths not routed via resolver"
      );
      this.test(
        "bg uses resolver",
        cContent.includes("'__BG_URL__'") ||
          /replace\('__BG_URL__',\s*resolveAsset\(/.test(cContent),
        "Background not dynamic"
      );
      this.test("syntax valid (container)", this.validateSyntax(cContent), "Syntax error");
    }

    // Summary
    console.log(`\n📊 Test Summary:`);
    console.log(`✅ Passed: ${this.results.passed}`);
    console.log(`❌ Failed: ${this.results.failed}`);
    console.log(
      `📈 Success Rate: ${Math.round((this.results.passed / (this.results.passed + this.results.failed)) * 100)}%`
    );

    if (this.results.failed > 0) {
      console.log(`\n❌ Failed Tests:`);
      this.results.tests
        .filter((t) => !t.passed)
        .forEach((t) => console.log(`  - ${t.name}: ${t.details}`));
    }

    return this.results;
  }

  getFileSize(path) {
    try {
      return statSync(path).size;
    } catch {
      return 0;
    }
  }

  section(name) {
    console.log(`\n— ${name} —`);
  }

  assertFile(name, path) {
    this.test(name, existsSync(path), `Missing ${path}`);
  }

  validateSyntax(code) {
    try {
      new vm.Script(code, { filename: "bundle.js" });
      return true;
    } catch (e) {
      console.log(`Syntax error: ${e.message}`);
      if (e.stack) console.log(e.stack.split("\n").slice(0, 3).join("\n"));
      return false;
    }
  }
}

// Run tests if called directly (robust across Windows/URL forms)
const invokedPath = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : "";
if (import.meta.url === invokedPath) {
  const tester = new EmbedTester();
  const results = await tester.run();
  process.exit(results.failed > 0 ? 1 : 0);
}

export { EmbedTester };
