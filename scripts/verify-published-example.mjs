import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gradleDependencies } from '../src/data/coordinates.ts';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const release = JSON.parse(readFileSync(join(root, 'src/data/release.json'), 'utf8'));
const example = JSON.parse(readFileSync(join(root, 'src/data/client-examples.json'), 'utf8'));
const args = process.argv.slice(2);
if (args.length !== 2 || args[0] !== '--gradle') {
  console.error('Usage: node scripts/verify-published-example.mjs --gradle /path/to/gradle-or-gradlew');
  process.exit(1);
}
if (example.source.commit !== release.implementation.commit) throw new Error('Example and release revisions differ.');

// The fixture supplies parameters and assertions around the unchanged displayed regions.
const directory = mkdtempSync(join(tmpdir(), 'sempods-published-example-'));
mkdirSync(join(directory, 'src/main/kotlin'), { recursive: true });
writeFileSync(join(directory, 'settings.gradle.kts'), 'rootProject.name = "sempods-published-example"\n');
writeFileSync(join(directory, 'build.gradle.kts'), `plugins {
  kotlin("jvm") version "${example.compilerVersion}"
  application
}
repositories { mavenCentral() }
${gradleDependencies}
kotlin { jvmToolchain(21) }
application { mainClass.set("ProbeKt") }
`);
writeFileSync(join(directory, 'src/main/kotlin/Probe.kt'), `import com.sun.net.httpserver.HttpServer
import java.net.InetSocketAddress
import okhttp3.OkHttpClient
import org.sempods.client.*

fun main() {
  val server = HttpServer.create(InetSocketAddress("127.0.0.1", 0), 0)
  var authorization: String? = null
  val body = """{"@id":"urn:example:event"}"""
  server.createContext("/alice/events/summer-party") { exchange ->
    authorization = exchange.requestHeaders.getFirst("Authorization")
    exchange.responseHeaders.add("Content-Type", "application/ld+json")
    val bytes = body.toByteArray()
    exchange.sendResponseHeaders(200, bytes.size.toLong())
    exchange.responseBody.use { it.write(bytes) }
  }
  server.start()
  val podUrl = "http://127.0.0.1:\${server.address.port}/alice"
  val resourceIri = "$podUrl/events/summer-party"
  ${example.snippets.install}
  try {
    ${example.snippets.publicRead.replaceAll('\n', '\n    ')}
    check(result.status == 200)
    check(result.body == body)
    check(authorization == null) { "Public example sent an Authorization header" }
    println("Published client example passed on Java \${Runtime.version().feature()}.")
  } finally {
    server.stop(0)
    http.dispatcher.executorService.shutdown()
    http.connectionPool.evictAll()
  }
}
`);
console.log(`Consumer fixture: ${directory}`);
const result = spawnSync(resolve(args[1]), ['--no-daemon', '-p', directory, 'run'], { stdio: 'inherit' });
if (result.error) console.error(result.error.message);
process.exitCode = result.status ?? 1;
