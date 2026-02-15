import Link from "next/link";
import Footer from "@/components/Footer";

/**
 * Support Page
 * 
 * Help and FAQ page with expandable questions.
 */
export default function SupportPage() {
  const faqs = [
    {
      question: "What is Buildwithme?",
      answer: "Buildwithme is an AI-powered pair programming platform that helps you learn to code by building real projects. Our AI assistant provides step-by-step guidance, code suggestions, and debugging help as you work on actual applications."
    },
    {
      question: "How does the AI pair programmer work?",
      answer: "The AI pair programmer analyzes your code in real-time, suggests improvements, explains concepts, and helps debug issues. It acts like a coding mentor, providing guidance tailored to your skill level and learning pace."
    },
    {
      question: "Do I need prior coding experience?",
      answer: "No prior experience is required! Buildwithme is designed for developers of all levels, from complete beginners to experienced programmers looking to learn new technologies or improve their skills."
    },
    {
      question: "What programming languages are supported?",
      answer: "Buildwithme supports popular programming languages including JavaScript, TypeScript, Python, React, Node.js, and more. We're constantly adding support for additional languages and frameworks."
    },
    {
      question: "Can I use Buildwithme for free?",
      answer: "Yes, we offer a free tier to get you started. You can upgrade to premium plans for advanced features, unlimited projects, and priority support."
    },
    {
      question: "How do I get started?",
      answer: "Simply click the 'Get Started' button on the homepage, create an account, and choose a project template or start from scratch. Our AI will guide you through the entire process."
    },
    {
      question: "Is my code private and secure?",
      answer: "Absolutely. Your code and projects are private and secure. We use industry-standard encryption and never share your code with third parties. You own all the code you create."
    },
    {
      question: "What kind of projects can I build?",
      answer: "You can build a wide variety of projects including web applications, APIs, mobile apps, data science projects, and more. We provide templates and step-by-step guidance for projects ranging from simple to complex."
    }
  ];

  return (
    <main className="min-h-screen code-pattern relative">
      {/* Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-6 py-32">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            Support & Help
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Find answers to common questions or get in touch with our support team.
          </p>
        </div>

        {/* Contact Information */}
        <div className="glass rounded-2xl p-8 mb-12 shadow-soft-lg">
          <h2 className="text-2xl font-bold mb-6 text-white">Get in Touch</h2>
          <div className="space-y-4">
            <div>
              <p className="text-gray-400 text-sm mb-1">Phone</p>
              <a 
                href="tel:+919699617331" 
                className="text-cyan-400 hover:text-cyan-300 transition-colors text-lg font-semibold"
              >
                +91 9699617331
              </a>
            </div>
            <div>
              <p className="text-gray-400 text-sm mb-1">Email</p>
              <a 
                href="mailto:codezista.support.team@gmail.com" 
                className="text-cyan-400 hover:text-cyan-300 transition-colors text-lg font-semibold break-all"
              >
                codezista.support.team@gmail.com
              </a>
            </div>
            <p className="text-gray-400 text-sm mt-6">
              Our support team is available 24/7 to assist you with any questions or issues.
            </p>
          </div>
        </div>

        {/* FAQ Section */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-8 text-white">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <details
                key={index}
                className="glass rounded-xl p-6 shadow-soft group"
              >
                <summary className="cursor-pointer text-lg font-semibold text-white hover:text-cyan-400 transition-colors list-none flex items-center justify-between">
                  <span>{faq.question}</span>
                  <span className="text-cyan-400 text-2xl ml-4 group-open:rotate-180 transition-transform duration-300">
                    ▼
                  </span>
                </summary>
                <div className="mt-4 pt-4 border-t border-gray-700">
                  <p className="text-gray-300 leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              </details>
            ))}
          </div>
        </section>

        {/* Back to Home */}
        <div className="text-center">
          <Link 
            href="/"
            className="inline-block px-6 py-3 glass text-white font-semibold rounded-xl border border-gray-600 hover:border-cyan-400 transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </main>
  );
}
