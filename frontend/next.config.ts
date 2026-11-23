import type { NextConfig } from "next";
import { headers } from "next/headers";

const nextConfig: NextConfig = {
  /* config options here */
  allowedDevOrigins: ["datebook-cabbie-unrefined.ngrok-free.dev"],
  async rewrites() {
    return [
      {
        source : "/api/:path*",
        destination : "http://localhost:8000/api/:path*"
      }
    ]
    
  },

};


export default nextConfig;



  // optional
  // async headers(){  
  //   return [
  //     {
  //       source: "/api/:path*",
  //       headers: [
  //         {
  //               key: "x-forwarded-for",
  //               value: "*",
  //             },
  //       ],
  //     }
  //   ]

  // },