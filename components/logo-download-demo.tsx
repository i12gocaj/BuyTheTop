import React from 'react'
import CrownLogo, { downloadCrownSvg } from '@/components/crown-logo'
import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'

export default function LogoDownloadDemo() {
  return (
    <div className="space-y-6 p-6 bg-[#1a1a1a] border border-[#333] rounded-lg">
      <h3 className="text-xl font-serif text-[#c9a96e]">Crown Logo</h3>
      
      {/* Logo examples */}
      <div className="space-y-4">
        <div className="flex items-center space-x-4">
          <span className="text-[#8a8a8a]">Small:</span>
          <CrownLogo size={16} color="#c9a96e" />
        </div>
        
        <div className="flex items-center space-x-4">
          <span className="text-[#8a8a8a]">Medium:</span>
          <CrownLogo size={24} color="#c9a96e" />
        </div>
        
        <div className="flex items-center space-x-4">
          <span className="text-[#8a8a8a]">Large:</span>
          <CrownLogo size={32} color="#c9a96e" />
        </div>
        
        <div className="flex items-center space-x-4">
          <span className="text-[#8a8a8a]">Extra Large:</span>
          <CrownLogo size={48} color="#c9a96e" />
        </div>
      </div>
      
      {/* Download button */}
      <Button
        onClick={downloadCrownSvg}
        variant="outline"
        className="bg-[#0a0a0a] border-[#333] text-[#c9a96e] hover:bg-[#c9a96e] hover:text-[#0a0a0a]"
      >
        <Download className="mr-2 h-4 w-4" />
        Descargar Logo SVG
      </Button>
      
      <p className="text-xs text-[#666]">
        El logo se descargará como un archivo SVG que puedes usar en cualquier aplicación de diseño o web.
      </p>
    </div>
  )
}
