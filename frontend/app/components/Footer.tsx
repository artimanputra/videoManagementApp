// app/components/Footer.tsx
import Link from "next/link";
import Image from "next/image";
export default function Footer() {
  return (
    <footer className="border-t border-[#1f1f1f] bg-[#0a0a0a]">
      <div className="max-w-6xl mx-auto px-6 py-10 text-sm text-gray-400">
        <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-8">
         
          <Link href="/" className="flex items-center gap-2">
          <Image
            src="/logo2.png"   
            alt="SplitStudio"
            width={72}
            height={72}
            priority
          />
          <span className="text-lg font-semibold text-white w-">
            SplitStudio
          </span>
        </Link>

          <div className="flex gap-10">
            <div>
              <div className="text-white mb-2">Product</div>
              <ul className="space-y-1">
                <li>
                  <a href="#features" className="hover:text-white">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#how-it-works" className="hover:text-white">
                    How it works
                  </a>
                </li>
                <li>
                  <a href="#demo" className="hover:text-white">
                    Demo
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <div className="text-white mb-2">App</div>
              <ul className="space-y-1">
                <li>
                  <Link href="/login" className="hover:text-white">
                    Login
                  </Link>
                </li>
                <li>
                  <Link href="/videos/create" className="hover:text-white">
                    Upload
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard" className="hover:text-white">
                    Dashboard
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <div className="text-white mb-2">Socials</div>
              <ul className="space-y-1">
                <li>
                  <Link
                    href="https://github.com/artimanputra/videoManagementApp"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-white"
                  >
                    GitHub Repo
                  </Link>
                </li>
                
                <li>
                  <Link
                    href="https://www.linkedin.com/in/arti-manputra/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-white"
                  >
                    LinkedIn
                  </Link>
                </li>

              </ul>
            </div>
          </div>
        </div>

        <div className="mt-8 text-xs text-gray-500">
          © {new Date().getFullYear()} Video Manager. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
