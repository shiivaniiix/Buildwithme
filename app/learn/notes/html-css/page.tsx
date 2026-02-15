"use client";

import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function HTMLCSSNotesPage() {
  return (
    <main className="min-h-screen code-pattern relative">
      <Navbar />

      <div className="relative z-10 max-w-4xl mx-auto px-6 py-32">
        <Link
          href="/learn"
          className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors text-sm font-medium mb-8"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span>Back to Learn</span>
        </Link>

        <header className="mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            HTML & CSS Foundations
          </h1>
          <p className="text-xl text-gray-300">
            Deep understanding of how browsers interpret markup and styles. Built for developers who want to think like the browser.
          </p>
        </header>

        <section id="html-foundations" className="mb-20">
          <h2 className="text-3xl font-bold mb-8 text-white border-b border-gray-700 pb-4">
            HTML — Foundations
          </h2>

          <div className="mb-12">
            <h3 className="text-2xl font-semibold mb-4 text-cyan-400">
              Browser Parsing & DOM Creation
            </h3>
            <div className="glass rounded-xl p-6 space-y-4 text-gray-300 leading-relaxed">
              <p>
                When you write HTML, you're not directly creating visual elements. You're writing instructions that the browser's parsing engine converts into a Document Object Model (DOM) tree. This mental model is crucial—HTML is declarative, not imperative.
              </p>
              <p>
                The browser reads your HTML character by character, tokenizes it (identifies tags, attributes, text nodes), then builds a tree structure in memory. This tree represents the document's hierarchy. Only after the DOM is constructed does the browser begin rendering pixels on screen.
              </p>
              <p>
                <strong className="text-white">Why this matters:</strong> Understanding this flow explains why certain optimizations work. For example, placing scripts at the bottom of the body doesn't just feel faster—it prevents the parser from blocking while JavaScript downloads and executes. The parser can continue building the DOM tree for elements that come after the script tag.
              </p>
              <div className="bg-gray-900/50 rounded-lg p-4 mt-4 border-l-4 border-cyan-500">
                <p className="text-sm text-gray-400 mb-2">Common beginner mistake:</p>
                <p className="text-sm">
                  Thinking HTML is "just text that gets displayed." HTML is actually a structured data format that browsers transform into an interactive object model. The visual representation is a byproduct of that model.
                </p>
              </div>
            </div>
          </div>

          <div className="mb-12">
            <h3 className="text-2xl font-semibold mb-4 text-cyan-400">
              Document Structure & Semantics
            </h3>
            <div className="glass rounded-xl p-6 space-y-4 text-gray-300 leading-relaxed">
              <p>
                Every HTML document follows a predictable structure: <code className="bg-gray-900 px-2 py-1 rounded text-cyan-400">DOCTYPE</code>, <code className="bg-gray-900 px-2 py-1 rounded text-cyan-400">&lt;html&gt;</code>, <code className="bg-gray-900 px-2 py-1 rounded text-cyan-400">&lt;head&gt;</code>, and <code className="bg-gray-900 px-2 py-1 rounded text-cyan-400">&lt;body&gt;</code>. This isn't arbitrary—each serves a specific purpose in how browsers and tools interpret your document.
              </p>
              <p>
                The DOCTYPE declaration tells the browser which parsing mode to use. Modern HTML5 uses <code className="bg-gray-900 px-2 py-1 rounded text-cyan-400">&lt;!DOCTYPE html&gt;</code>, which triggers standards mode. Without it, browsers fall back to quirks mode, where they emulate bugs from older browsers for backward compatibility. You'll see layout differences immediately.
              </p>
              <p>
                The <code className="bg-gray-900 px-2 py-1 rounded text-cyan-400">&lt;head&gt;</code> section contains metadata—information about the document that isn't displayed but is crucial for how the browser and other tools (search engines, social media scrapers, screen readers) understand your page. This is where you set character encoding, viewport settings, and link to external resources.
              </p>
            </div>
          </div>

          <div className="mb-12">
            <h3 className="text-2xl font-semibold mb-4 text-cyan-400">
              Why Semantic Tags Matter
            </h3>
            <div className="glass rounded-xl p-6 space-y-4 text-gray-300 leading-relaxed">
              <p>
                Semantic HTML elements like <code className="bg-gray-900 px-2 py-1 rounded text-cyan-400">&lt;header&gt;</code>, <code className="bg-gray-900 px-2 py-1 rounded text-cyan-400">&lt;nav&gt;</code>, <code className="bg-gray-900 px-2 py-1 rounded text-cyan-400">&lt;article&gt;</code>, and <code className="bg-gray-900 px-2 py-1 rounded text-cyan-400">&lt;footer&gt;</code> communicate meaning, not just presentation. This has three critical benefits:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>
                  <strong className="text-white">SEO:</strong> Search engines use semantic structure to understand content hierarchy. A <code className="bg-gray-900 px-2 py-1 rounded text-cyan-400">&lt;main&gt;</code> tag tells crawlers where primary content lives, improving how your page is indexed.
                </li>
                <li>
                  <strong className="text-white">Accessibility:</strong> Screen readers navigate by semantic landmarks. Users can jump directly to <code className="bg-gray-900 px-2 py-1 rounded text-cyan-400">&lt;nav&gt;</code> or <code className="bg-gray-900 px-2 py-1 rounded text-cyan-400">&lt;main&gt;</code> without hearing every heading. This isn't a nice-to-have—it's how assistive technology works.
                </li>
                <li>
                  <strong className="text-white">Maintainability:</strong> When you see <code className="bg-gray-900 px-2 py-1 rounded text-cyan-400">&lt;article&gt;</code>, you immediately know this is standalone content. Future developers (including yourself in six months) can understand structure without reading CSS or JavaScript.
                </li>
              </ul>
              <div className="bg-gray-900/50 rounded-lg p-4 mt-4 border-l-4 border-yellow-500">
                <p className="text-sm text-gray-400 mb-2">Production practice:</p>
                <p className="text-sm">
                  Use semantic HTML even when you think "I'll just style it with CSS anyway." The semantic layer is separate from presentation. You can make a <code className="bg-gray-900 px-2 py-1 rounded text-cyan-400">&lt;button&gt;</code> look like a link, but it will still behave like a button (keyboard accessible, focusable, announces as button to screen readers).
                </p>
              </div>
            </div>
          </div>

          <div className="mb-12">
            <h3 className="text-2xl font-semibold mb-4 text-cyan-400">
              Block vs Inline Elements: Real Layout Behavior
            </h3>
            <div className="glass rounded-xl p-6 space-y-4 text-gray-300 leading-relaxed">
              <p>
                Block-level elements (like <code className="bg-gray-900 px-2 py-1 rounded text-cyan-400">&lt;div&gt;</code>, <code className="bg-gray-900 px-2 py-1 rounded text-cyan-400">&lt;p&gt;</code>, <code className="bg-gray-900 px-2 py-1 rounded text-cyan-400">&lt;section&gt;</code>) create a new formatting context. They take up the full width of their container by default and stack vertically. This isn't just visual—it's how the browser's layout engine calculates space.
              </p>
              <p>
                Inline elements (like <code className="bg-gray-900 px-2 py-1 rounded text-cyan-400">&lt;span&gt;</code>, <code className="bg-gray-900 px-2 py-1 rounded text-cyan-400">&lt;a&gt;</code>, <code className="bg-gray-900 px-2 py-1 rounded text-cyan-400">&lt;strong&gt;</code>) flow within the text content. They don't create new lines and only take up as much width as their content requires. The browser treats them as part of the text flow, not as independent boxes.
              </p>
              <p>
                <strong className="text-white">The critical insight:</strong> You can change this behavior with CSS (display: block, display: inline-block), but understanding the default helps you predict layout without constantly checking the browser. When a layout breaks unexpectedly, ask: "Is this element block or inline by default, and does my CSS override that?"
              </p>
              <div className="bg-gray-900/50 rounded-lg p-4 mt-4">
                <p className="text-sm text-gray-400 mb-2">Real-world example:</p>
                <p className="text-sm mb-2">
                  A common mistake: trying to add width/height to an inline element like <code className="bg-gray-900 px-2 py-1 rounded text-cyan-400">&lt;a&gt;</code>. Inline elements ignore width and height properties. You need <code className="bg-gray-900 px-2 py-1 rounded text-cyan-400">display: inline-block</code> or <code className="bg-gray-900 px-2 py-1 rounded text-cyan-400">display: block</code> first.
                </p>
              </div>
            </div>
          </div>

          <div className="mb-12">
            <h3 className="text-2xl font-semibold mb-4 text-cyan-400">
              Forms: How Data Flows
            </h3>
            <div className="glass rounded-xl p-6 space-y-4 text-gray-300 leading-relaxed">
              <p>
                HTML forms are the bridge between user input and server processing. Understanding the data flow prevents security issues and improves user experience.
              </p>
              <p>
                When a user submits a form, the browser collects all form controls (inputs, selects, textareas) with a <code className="bg-gray-900 px-2 py-1 rounded text-cyan-400">name</code> attribute. It constructs a data payload based on the form's <code className="bg-gray-900 px-2 py-1 rounded text-cyan-400">method</code> (GET appends to URL as query string, POST sends in request body) and <code className="bg-gray-900 px-2 py-1 rounded text-cyan-400">enctype</code> (how data is encoded).
              </p>
              <p>
                <strong className="text-white">Client-side validation</strong> (HTML5 attributes like <code className="bg-gray-900 px-2 py-1 rounded text-cyan-400">required</code>, <code className="bg-gray-900 px-2 py-1 rounded text-cyan-400">pattern</code>, <code className="bg-gray-900 px-2 py-1 rounded text-cyan-400">type="email"</code>) provides immediate feedback and reduces server load. But never trust it alone—always validate on the server. Users can disable JavaScript, modify HTML, or send requests directly to your API.
              </p>
              <p>
                <strong className="text-white">Accessibility in forms:</strong> Every input needs a <code className="bg-gray-900 px-2 py-1 rounded text-cyan-400">&lt;label&gt;</code> associated via <code className="bg-gray-900 px-2 py-1 rounded text-cyan-400">for</code> attribute or by wrapping the input. Screen readers announce labels, and clicking labels focuses inputs. Group related fields with <code className="bg-gray-900 px-2 py-1 rounded text-cyan-400">&lt;fieldset&gt;</code> and <code className="bg-gray-900 px-2 py-1 rounded text-cyan-400">&lt;legend&gt;</code> for better navigation.
              </p>
            </div>
          </div>

          <div className="mb-12">
            <h3 className="text-2xl font-semibold mb-4 text-cyan-400">
              Attributes vs Properties: Why This Distinction Matters
            </h3>
            <div className="glass rounded-xl p-6 space-y-4 text-gray-300 leading-relaxed">
              <p>
                This is one of the most misunderstood concepts, and it causes bugs that are hard to debug. <strong className="text-white">Attributes</strong> are what you write in HTML. <strong className="text-white">Properties</strong> are what exist on the DOM object in JavaScript.
              </p>
              <p>
                When the browser parses HTML, it reads attributes and creates corresponding properties on the DOM node. For most cases, they match. But there are critical differences:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>
                  <code className="bg-gray-900 px-2 py-1 rounded text-cyan-400">class</code> (HTML attribute) becomes <code className="bg-gray-900 px-2 py-1 rounded text-cyan-400">className</code> (JavaScript property) because "class" is a reserved word in JavaScript.
                </li>
                <li>
                  Boolean attributes like <code className="bg-gray-900 px-2 py-1 rounded text-cyan-400">disabled</code> or <code className="bg-gray-900 px-2 py-1 rounded text-cyan-400">checked</code> are true if the attribute exists (even as <code className="bg-gray-900 px-2 py-1 rounded text-cyan-400">disabled=""</code>), false if absent. The property is a boolean, not a string.
                </li>
                <li>
                  Some attributes are one-way: setting <code className="bg-gray-900 px-2 py-1 rounded text-cyan-400">element.value</code> in JavaScript doesn't update the HTML attribute, but it does update what the user sees.
                </li>
              </ul>
              <div className="bg-gray-900/50 rounded-lg p-4 mt-4 border-l-4 border-red-500">
                <p className="text-sm text-gray-400 mb-2">Debugging tip:</p>
                <p className="text-sm">
                  If you're checking <code className="bg-gray-900 px-2 py-1 rounded text-cyan-400">element.getAttribute('value')</code> on an input and it's null, that's normal. The value property reflects the current state; the value attribute is only the initial default. Use <code className="bg-gray-900 px-2 py-1 rounded text-cyan-400">element.value</code> for the current value.
                </p>
              </div>
            </div>
          </div>

          <div className="mb-12">
            <h3 className="text-2xl font-semibold mb-4 text-cyan-400">
              Common Beginner Mistakes
            </h3>
            <div className="glass rounded-xl p-6 space-y-4 text-gray-300 leading-relaxed">
              <ul className="space-y-3">
                <li>
                  <strong className="text-white">Using divs for everything:</strong> While <code className="bg-gray-900 px-2 py-1 rounded text-cyan-400">&lt;div&gt;</code> is versatile, overusing it creates "div soup"—HTML that's impossible to understand without CSS. Semantic elements make your code self-documenting.
                </li>
                <li>
                  <strong className="text-white">Nesting block elements inside inline elements:</strong> You can't put a <code className="bg-gray-900 px-2 py-1 rounded text-cyan-400">&lt;div&gt;</code> inside a <code className="bg-gray-900 px-2 py-1 rounded text-cyan-400">&lt;span&gt;</code>. The browser will auto-close the inline element, causing unexpected structure.
                </li>
                <li>
                  <strong className="text-white">Forgetting to close tags or mismatching:</strong> Modern browsers are forgiving, but invalid HTML leads to inconsistent rendering across browsers and breaks tools like screen readers.
                </li>
                <li>
                  <strong className="text-white">Using presentational attributes:</strong> Attributes like <code className="bg-gray-900 px-2 py-1 rounded text-cyan-400">bgcolor</code>, <code className="bg-gray-900 px-2 py-1 rounded text-cyan-400">align</code>, <code className="bg-gray-900 px-2 py-1 rounded text-cyan-400">font</code> are deprecated. Use CSS instead—it separates structure from presentation.
                </li>
              </ul>
            </div>
          </div>
        </section>

        <section id="css-foundations" className="mb-20">
          <h2 className="text-3xl font-bold mb-8 text-white border-b border-gray-700 pb-4">
            CSS — Foundations
          </h2>

          <div className="mb-12">
            <h3 className="text-2xl font-semibold mb-4 text-cyan-400">
              How CSS is Parsed and Applied
            </h3>
            <div className="glass rounded-xl p-6 space-y-4 text-gray-300 leading-relaxed">
              <p>
                CSS doesn't execute like JavaScript. It's a declarative language that the browser's CSS engine parses into a set of rules, then matches against DOM elements. Understanding this process explains why certain selectors are slow and why some styles seem to "not work."
              </p>
              <p>
                The browser reads CSS from top to bottom, building a stylesheet object. When it encounters a rule like <code className="bg-gray-900 px-2 py-1 rounded text-cyan-400">.button {'{'} color: red; {'}'}</code>, it stores the selector and declarations. Later, during rendering, it walks the DOM tree and applies matching rules.
              </p>
              <p>
                <strong className="text-white">Selector matching:</strong> The browser evaluates selectors from right to left. For <code className="bg-gray-900 px-2 py-1 rounded text-cyan-400">.nav .button</code>, it first finds all elements with class "button", then checks if they have an ancestor with class "nav". This is why overly specific selectors are slow—the browser does more work.
              </p>
              <p>
                <strong className="text-white">Why order matters:</strong> When multiple rules target the same element, the cascade determines which wins. But if specificity is equal, the last rule in the stylesheet wins. This is why loading order of CSS files matters, and why inline styles (highest specificity) override everything.
              </p>
            </div>
          </div>

          <div className="mb-12">
            <h3 className="text-2xl font-semibold mb-4 text-cyan-400">
              Cascade, Specificity, Inheritance: Resolving Conflicts
            </h3>
            <div className="glass rounded-xl p-6 space-y-4 text-gray-300 leading-relaxed">
              <p>
                When multiple CSS rules could apply to the same element, the browser uses three mechanisms to decide: cascade, specificity, and inheritance.
              </p>
              <p>
                <strong className="text-white">Cascade:</strong> The order of rules matters. Later rules override earlier ones if specificity is equal. This is why reset stylesheets come first, then base styles, then component styles, then utility classes.
              </p>
              <p>
                <strong className="text-white">Specificity:</strong> This is a scoring system. Inline styles (1000 points), IDs (100 points each), classes/attributes/pseudo-classes (10 points each), elements/pseudo-elements (1 point each). The highest score wins. <code className="bg-gray-900 px-2 py-1 rounded text-cyan-400">#header .nav a:hover</code> has specificity 121 (100 + 10 + 1 + 10), so it beats <code className="bg-gray-900 px-2 py-1 rounded text-cyan-400">.nav a</code> (21 points).
              </p>
              <p>
                <strong className="text-white">Inheritance:</strong> Some properties (like <code className="bg-gray-900 px-2 py-1 rounded text-cyan-400">color</code>, <code className="bg-gray-900 px-2 py-1 rounded text-cyan-400">font-family</code>) are inherited by child elements. Others (like <code className="bg-gray-900 px-2 py-1 rounded text-cyan-400">margin</code>, <code className="bg-gray-900 px-2 py-1 rounded text-cyan-400">padding</code>) are not. You can force inheritance with <code className="bg-gray-900 px-2 py-1 rounded text-cyan-400">inherit</code> or prevent it with <code className="bg-gray-900 px-2 py-1 rounded text-cyan-400">initial</code>.
              </p>
              <div className="bg-gray-900/50 rounded-lg p-4 mt-4">
                <p className="text-sm text-gray-400 mb-2">Real conflict example:</p>
                <pre className="text-sm bg-gray-950 p-3 rounded overflow-x-auto">
{`/* Rule 1: Specificity 10 */
.button { color: blue; }

/* Rule 2: Specificity 11 */
div.button { color: red; }

/* Rule 3: Specificity 10, but comes later */
.button { color: green; }

/* Result: red wins (highest specificity)
   If Rule 2 didn't exist, green would win (cascade)`}
                </pre>
              </div>
            </div>
          </div>

          <div className="mb-12">
            <h3 className="text-2xl font-semibold mb-4 text-cyan-400">
              Box Model: The Mental Model
            </h3>
            <div className="glass rounded-xl p-6 space-y-4 text-gray-300 leading-relaxed">
              <p>
                Every element is a rectangular box. From inside out: content area, padding, border, margin. This isn't just visual—it's how the browser calculates layout. When you set <code className="bg-gray-900 px-2 py-1 rounded text-cyan-400">width: 200px</code>, you're setting the content width by default. Padding and border add to that total.
              </p>
              <p>
                <code className="bg-gray-900 px-2 py-1 rounded text-cyan-400">box-sizing: border-box</code> changes this. Now width includes padding and border. This is why modern CSS resets set it globally—it makes layout calculations predictable. A 200px box with 20px padding is 200px total, not 240px.
              </p>
              <p>
                <strong className="text-white">Margin collapse:</strong> Vertical margins between adjacent block elements collapse. The larger margin wins. This catches beginners off guard. Horizontal margins never collapse. Margins between parent and first/last child can also collapse in certain situations.
              </p>
              <p>
                <strong className="text-white">Why this matters for layout:</strong> When a layout breaks, check the box model. Is your element wider than expected? Check padding and border. Are elements too far apart? Check margin collapse. Use browser DevTools to visualize the box model—it shows content, padding, border, and margin as colored layers.
              </p>
            </div>
          </div>

          <div className="mb-12">
            <h3 className="text-2xl font-semibold mb-4 text-cyan-400">
              Layout Systems: When to Use What
            </h3>
            <div className="glass rounded-xl p-6 space-y-4 text-gray-300 leading-relaxed">
              <p>
                CSS offers multiple layout systems, each solving different problems. Choosing the right one prevents over-engineering and performance issues.
              </p>
              <ul className="space-y-3">
                <li>
                  <strong className="text-white">Normal Flow:</strong> Default block and inline layout. Use for document-style content. Simple, predictable, accessible.
                </li>
                <li>
                  <strong className="text-white">Flexbox:</strong> One-dimensional layouts (row or column). Perfect for navigation bars, card layouts, centering content. Solves "how do I center this?" problems elegantly.
                </li>
                <li>
                  <strong className="text-white">Grid:</strong> Two-dimensional layouts (rows and columns). Use for page layouts, complex dashboards, card grids. More powerful than flexbox for 2D layouts, but also more complex.
                </li>
                <li>
                  <strong className="text-white">Positioning:</strong> <code className="bg-gray-900 px-2 py-1 rounded text-cyan-400">absolute</code>, <code className="bg-gray-900 px-2 py-1 rounded text-cyan-400">fixed</code>, <code className="bg-gray-900 px-2 py-1 rounded text-cyan-400">sticky</code> remove elements from normal flow. Use sparingly—for overlays, modals, sticky headers. Overuse creates maintenance nightmares.
                </li>
              </ul>
              <div className="bg-gray-900/50 rounded-lg p-4 mt-4 border-l-4 border-cyan-500">
                <p className="text-sm text-gray-400 mb-2">Decision framework:</p>
                <p className="text-sm">
                  Need to align items in one direction? Flexbox. Need a table-like structure with rows and columns? Grid. Need something to stay in a specific position regardless of scroll? Positioning. Start with the simplest solution that works.
                </p>
              </div>
            </div>
          </div>

          <div className="mb-12">
            <h3 className="text-2xl font-semibold mb-4 text-cyan-400">
              Colors, Units, Typography: Real-World Decisions
            </h3>
            <div className="glass rounded-xl p-6 space-y-4 text-gray-300 leading-relaxed">
              <p>
                <strong className="text-white">Color formats:</strong> <code className="bg-gray-900 px-2 py-1 rounded text-cyan-400">hex</code> (#ff0000) is compact and widely supported. <code className="bg-gray-900 px-2 py-1 rounded text-cyan-400">rgb()</code> is readable. <code className="bg-gray-900 px-2 py-1 rounded text-cyan-400">hsl()</code> makes it easy to create variations (adjust lightness for hover states). <code className="bg-gray-900 px-2 py-1 rounded text-cyan-400">rgba()</code> and <code className="bg-gray-900 px-2 py-1 rounded text-cyan-400">hsla()</code> add alpha transparency. Modern browsers support <code className="bg-gray-900 px-2 py-1 rounded text-cyan-400">rgb()</code> and <code className="bg-gray-900 px-2 py-1 rounded text-cyan-400">hsl()</code> with alpha as the fourth parameter.
              </p>
              <p>
                <strong className="text-white">Units:</strong> <code className="bg-gray-900 px-2 py-1 rounded text-cyan-400">px</code> is absolute—one pixel. <code className="bg-gray-900 px-2 py-1 rounded text-cyan-400">em</code> is relative to the element's font size. <code className="bg-gray-900 px-2 py-1 rounded text-cyan-400">rem</code> is relative to the root element's font size—predictable and preferred for spacing. <code className="bg-gray-900 px-2 py-1 rounded text-cyan-400">%</code> is relative to the parent. <code className="bg-gray-900 px-2 py-1 rounded text-cyan-400">vw</code>/<code className="bg-gray-900 px-2 py-1 rounded text-cyan-400">vh</code> are viewport-relative. Use <code className="bg-gray-900 px-2 py-1 rounded text-cyan-400">rem</code> for spacing and typography to maintain consistent scale.
              </p>
              <p>
                <strong className="text-white">Typography:</strong> Font stacks should include fallbacks. <code className="bg-gray-900 px-2 py-1 rounded text-cyan-400">font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;</code> tries Inter first, falls back to system fonts. Line height should be unitless (1.5) to scale with font size. Use <code className="bg-gray-900 px-2 py-1 rounded text-cyan-400">font-weight</code> values 400 (normal) and 700 (bold) for best cross-browser support, or variable fonts for fine control.
              </p>
            </div>
          </div>

          <div className="mb-12">
            <h3 className="text-2xl font-semibold mb-4 text-cyan-400">
              Performance: What Actually Slows Things Down
            </h3>
            <div className="glass rounded-xl p-6 space-y-4 text-gray-300 leading-relaxed">
              <p>
                CSS performance isn't about file size alone—it's about how the browser processes styles.
              </p>
              <p>
                <strong className="text-white">Slow selectors:</strong> Avoid deep descendant selectors like <code className="bg-gray-900 px-2 py-1 rounded text-cyan-400">.nav ul li a span</code>. The browser evaluates right-to-left, so it finds all spans, then checks if they're in an anchor, then if that's in a list item, etc. Use classes directly: <code className="bg-gray-900 px-2 py-1 rounded text-cyan-400">.nav-link-text</code>.
              </p>
              <p>
                <strong className="text-white">Repaint vs Reflow:</strong> Changing <code className="bg-gray-900 px-2 py-1 rounded text-cyan-400">color</code> or <code className="bg-gray-900 px-2 py-1 rounded text-cyan-400">background</code> triggers a repaint (redraw pixels). Changing <code className="bg-gray-900 px-2 py-1 rounded text-cyan-400">width</code> or <code className="bg-gray-900 px-2 py-1 rounded text-cyan-400">height</code> triggers a reflow (recalculate layout). Reflows are expensive—they can cause layout shifts and jank. Use <code className="bg-gray-900 px-2 py-1 rounded text-cyan-400">transform</code> and <code className="bg-gray-900 px-2 py-1 rounded text-cyan-400">opacity</code> for animations—they don't trigger reflow.
              </p>
              <p>
                <strong className="text-white">Critical CSS:</strong> Above-the-fold content should have its styles inline or loaded first. External stylesheets block rendering—the browser waits to download and parse them before painting. Use <code className="bg-gray-900 px-2 py-1 rounded text-cyan-400">&lt;link rel="preload"&gt;</code> for non-critical CSS to load it asynchronously.
              </p>
            </div>
          </div>

          <div className="mb-12">
            <h3 className="text-2xl font-semibold mb-4 text-cyan-400">
              CSS Architecture: Scaling Styles
            </h3>
            <div className="glass rounded-xl p-6 space-y-4 text-gray-300 leading-relaxed">
              <p>
                As projects grow, CSS becomes unmaintainable without structure. Common approaches:
              </p>
              <ul className="space-y-3">
                <li>
                  <strong className="text-white">BEM (Block Element Modifier):</strong> Naming convention like <code className="bg-gray-900 px-2 py-1 rounded text-cyan-400">.button</code>, <code className="bg-gray-900 px-2 py-1 rounded text-cyan-400">.button__icon</code>, <code className="bg-gray-900 px-2 py-1 rounded text-cyan-400">.button--primary</code>. Makes relationships explicit and prevents specificity wars.
                </li>
                <li>
                  <strong className="text-white">Utility-first (Tailwind):</strong> Small, single-purpose classes like <code className="bg-gray-900 px-2 py-1 rounded text-cyan-400">.text-center</code>, <code className="bg-gray-900 px-2 py-1 rounded text-cyan-400">.p-4</code>. Fast to write, consistent spacing, but can make HTML verbose.
                </li>
                <li>
                  <strong className="text-white">CSS Modules / Scoped Styles:</strong> Styles are scoped to components, preventing global conflicts. Class names are hashed at build time.
                </li>
              </ul>
              <p>
                The key is consistency. Pick an approach and stick to it. Mixing approaches creates confusion. Document your conventions so the team follows them.
              </p>
            </div>
          </div>

          <div className="mb-12">
            <h3 className="text-2xl font-semibold mb-4 text-cyan-400">
              Common CSS Pitfalls and Debugging Strategies
            </h3>
            <div className="glass rounded-xl p-6 space-y-4 text-gray-300 leading-relaxed">
              <ul className="space-y-3">
                <li>
                  <strong className="text-white">"My styles aren't applying":</strong> Check specificity. Use DevTools to see which rules are active and which are crossed out. Look for typos in class names. Check if styles are loaded (Network tab).
                </li>
                <li>
                  <strong className="text-white">"Layout breaks on different screen sizes":</strong> Check for fixed widths, missing responsive units, or media queries that don't account for edge cases. Test at common breakpoints: 320px, 768px, 1024px, 1920px.
                </li>
                <li>
                  <strong className="text-white">"Elements overlap unexpectedly":</strong> Check z-index stacking context. Elements with <code className="bg-gray-900 px-2 py-1 rounded text-cyan-400">position: relative/absolute/fixed</code> create new stacking contexts. Higher z-index only wins within the same context.
                </li>
                <li>
                  <strong className="text-white">"Animations are janky":</strong> Use <code className="bg-gray-900 px-2 py-1 rounded text-cyan-400">transform</code> and <code className="bg-gray-900 px-2 py-1 rounded text-cyan-400">opacity</code>—they're GPU-accelerated. Avoid animating <code className="bg-gray-900 px-2 py-1 rounded text-cyan-400">width</code>, <code className="bg-gray-900 px-2 py-1 rounded text-cyan-400">height</code>, <code className="bg-gray-900 px-2 py-1 rounded text-cyan-400">margin</code>, <code className="bg-gray-900 px-2 py-1 rounded text-cyan-400">padding</code>.
                </li>
              </ul>
              <div className="bg-gray-900/50 rounded-lg p-4 mt-4">
                <p className="text-sm text-gray-400 mb-2">Debugging workflow:</p>
                <ol className="text-sm list-decimal list-inside space-y-1 ml-2">
                  <li>Open DevTools, inspect the element</li>
                  <li>Check Computed styles (not just Rules) to see final values</li>
                  <li>Look for crossed-out rules—they're being overridden</li>
                  <li>Check the box model visualization</li>
                  <li>Use the selector specificity calculator if needed</li>
                </ol>
              </div>
            </div>
          </div>
        </section>

        <section id="practical-thinking" className="mb-20">
          <h2 className="text-3xl font-bold mb-8 text-white border-b border-gray-700 pb-4">
            Practical Thinking
          </h2>

          <div className="mb-12">
            <h3 className="text-2xl font-semibold mb-4 text-cyan-400">
              How the Browser Thinks vs How Beginners Think
            </h3>
            <div className="glass rounded-xl p-6 space-y-4 text-gray-300 leading-relaxed">
              <p>
                <strong className="text-white">Beginner thinking:</strong> "I'll add a div here and style it to look like a button."
              </p>
              <p>
                <strong className="text-white">Browser reality:</strong> The browser doesn't care about appearance—it builds a tree structure, then applies styles. A <code className="bg-gray-900 px-2 py-1 rounded text-cyan-400">&lt;div&gt;</code> styled like a button still isn't a button. It won't be keyboard accessible, won't announce as a button to screen readers, and won't respond to Enter/Space keys.
              </p>
              <p>
                <strong className="text-white">Beginner thinking:</strong> "I'll use inline styles because it's faster."
              </p>
              <p>
                <strong className="text-white">Browser reality:</strong> Inline styles have the highest specificity, making them hard to override. They can't use media queries, pseudo-classes, or be shared across elements. They're also harder to maintain and test.
              </p>
              <p>
                <strong className="text-white">Beginner thinking:</strong> "I'll use !important to fix this style conflict."
              </p>
              <p>
                <strong className="text-white">Browser reality:</strong> <code className="bg-gray-900 px-2 py-1 rounded text-cyan-400">!important</code> breaks the cascade. It's a code smell—it means your specificity is wrong or your architecture needs refactoring. Use it only for utility overrides or third-party library conflicts.
              </p>
            </div>
          </div>

          <div className="mb-12">
            <h3 className="text-2xl font-semibold mb-4 text-cyan-400">
              Why Your Layout Breaks Unexpectedly
            </h3>
            <div className="glass rounded-xl p-6 space-y-4 text-gray-300 leading-relaxed">
              <p>
                Layout breaks usually come from one of these root causes:
              </p>
              <ul className="space-y-3">
                <li>
                  <strong className="text-white">Box model confusion:</strong> You set <code className="bg-gray-900 px-2 py-1 rounded text-cyan-400">width: 50%</code> and <code className="bg-gray-900 px-2 py-1 rounded text-cyan-400">padding: 20px</code>, expecting 50% total width. Without <code className="bg-gray-900 px-2 py-1 rounded text-cyan-400">box-sizing: border-box</code>, you get 50% + 40px, causing overflow.
                </li>
                <li>
                  <strong className="text-white">Margin collapse:</strong> Two elements with <code className="bg-gray-900 px-2 py-1 rounded text-cyan-400">margin-bottom: 20px</code> and <code className="bg-gray-900 px-2 py-1 rounded text-cyan-400">margin-top: 30px</code> have 30px between them, not 50px. The larger margin wins.
                </li>
                <li>
                  <strong className="text-white">Float clearing:</strong> Floated elements are removed from normal flow. Parent containers collapse (height becomes 0) unless you clear floats with <code className="bg-gray-900 px-2 py-1 rounded text-cyan-400">clearfix</code> or <code className="bg-gray-900 px-2 py-1 rounded text-cyan-400">overflow: hidden</code>.
                </li>
                <li>
                  <strong className="text-white">Viewport units on mobile:</strong> <code className="bg-gray-900 px-2 py-1 rounded text-cyan-400">100vh</code> includes the browser's address bar on mobile, causing scroll issues. Use <code className="bg-gray-900 px-2 py-1 rounded text-cyan-400">100dvh</code> (dynamic viewport height) or JavaScript to calculate true viewport.
                </li>
              </ul>
            </div>
          </div>

          <div className="mb-12">
            <h3 className="text-2xl font-semibold mb-4 text-cyan-400">
              How to Debug HTML/CSS Without Guessing
            </h3>
            <div className="glass rounded-xl p-6 space-y-4 text-gray-300 leading-relaxed">
              <p>
                Effective debugging is systematic, not random. Follow this process:
              </p>
              <ol className="list-decimal list-inside space-y-2 ml-4">
                <li>
                  <strong className="text-white">Reproduce the issue:</strong> Can you make it happen consistently? What are the exact conditions (browser, screen size, interaction)?
                </li>
                <li>
                  <strong className="text-white">Isolate the problem:</strong> Remove unrelated code. Does the issue persist? If not, you've found the culprit.
                </li>
                <li>
                  <strong className="text-white">Inspect in DevTools:</strong> Look at Computed styles, not just the Rules panel. Computed shows final values after all CSS is applied.
                </li>
                <li>
                  <strong className="text-white">Check the box model:</strong> Is the element the size you expect? Are margins/padding what you think?
                </li>
                <li>
                  <strong className="text-white">Test your assumptions:</strong> Add a bright border temporarily: <code className="bg-gray-900 px-2 py-1 rounded text-cyan-400">border: 3px solid red;</code>. This visualizes the element's boundaries.
                </li>
                <li>
                  <strong className="text-white">Validate HTML:</strong> Use the W3C validator. Invalid HTML can cause unexpected rendering.
                </li>
                <li>
                  <strong className="text-white">Check for typos:</strong> Class names are case-sensitive. <code className="bg-gray-900 px-2 py-1 rounded text-cyan-400">.Button</code> and <code className="bg-gray-900 px-2 py-1 rounded text-cyan-400">.button</code> are different.
                </li>
              </ol>
            </div>
          </div>

          <div className="mb-12">
            <h3 className="text-2xl font-semibold mb-4 text-cyan-400">
              Production-Level Best Practices
            </h3>
            <div className="glass rounded-xl p-6 space-y-4 text-gray-300 leading-relaxed">
              <ul className="space-y-3">
                <li>
                  <strong className="text-white">Use semantic HTML first:</strong> Structure your content correctly, then style it. Don't use CSS to create structure that should be in HTML.
                </li>
                <li>
                  <strong className="text-white">Mobile-first responsive design:</strong> Start with mobile styles, then use <code className="bg-gray-900 px-2 py-1 rounded text-cyan-400">min-width</code> media queries to enhance for larger screens. This prevents over-engineering for desktop.
                </li>
                <li>
                  <strong className="text-white">Test accessibility:</strong> Use keyboard navigation (Tab, Enter, Space). Test with a screen reader. Check color contrast ratios (WCAG AA requires 4.5:1 for normal text).
                </li>
                <li>
                  <strong className="text-white">Optimize for performance:</strong> Minimize CSS, use efficient selectors, avoid expensive properties in animations, load critical CSS inline.
                </li>
                <li>
                  <strong className="text-white">Document your decisions:</strong> Why did you choose this layout system? Why this naming convention? Comments in code help future maintainers (including yourself).
                </li>
                <li>
                  <strong className="text-white">Version control your styles:</strong> CSS is code. Review it in pull requests. Refactor when it becomes unmaintainable.
                </li>
              </ul>
            </div>
          </div>
        </section>

        <div className="mt-16 pt-8 border-t border-gray-700">
          <p className="text-gray-400 text-sm text-center">
            This content is part of Buildwithme by Codezista. Keep building, keep learning.
          </p>
        </div>
      </div>

      <Footer />
    </main>
  );
}
