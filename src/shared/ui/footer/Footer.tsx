import { cn } from "@shared/lib";

export function Footer({ className }: { className?: string }) {
  const openLink = (url: string) => {
    if (url) window.electronAPI?.shell.openExternal(url);
  };

  return (
    <footer
      className={cn(
        "w-full py-6 px-8 mt-6 flex flex-col items-center justify-center gap-4 text-forest-500 select-none glass-panel rounded-2xl bg-white/60 border border-white/50 shadow-sm backdrop-blur-md",
        className
      )}
    >
      {/* 소셜 아이콘 */}
      <div className="flex items-center gap-6">
        {/* GitHub */}
        <button
          onClick={() => openLink("")} // TODO: GitHub URL 입력
          className="hover:text-forest-800 hover:scale-110 transition-all duration-300 group relative p-1"
          title="GitHub"
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path
              fillRule="evenodd"
              d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
              clipRule="evenodd"
            />
          </svg>
        </button>

        {/* Instagram */}
        <button
          onClick={() => openLink("https://www.instagram.com/relax_plz_/")}
          className="hover:text-pink-500 hover:scale-110 transition-all duration-300 p-1"
          title="Instagram"
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path
              fillRule="evenodd"
              d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.451 2.535c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.825-.049.905-.039 1.498-.18 1.841-.31.62-.249 1.127-.756 1.376-1.376.13-.343.271-.936.31-1.841.04-.908.049-1.228.049-3.825v-.08c0-2.684.016-3.376-.08-4.32-.086-.84-.282-1.285-.45-1.53a4.237 4.237 0 00-1.077-1.129 4.237 4.237 0 00-1.53-.45c-.944-.096-1.636-.109-4.32-.109zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>

      {/* 정보 텍스트 */}
      <div className="flex flex-col items-center gap-1.5">
        <p className="text-sm font-medium opacity-90">
          Copyright © 2026{" "}
          <span className="font-bold text-forest-700">Hardy</span>. All rights
          reserved.
        </p>
        <a
          href="mailto:hardyjumpit@gmail.com"
          className="text-xs font-mono opacity-60 hover:opacity-100 hover:text-fairy-600 transition-colors"
        >
          hardyjumpit@gmail.com
        </a>
      </div>
    </footer>
  );
}
