import { useState } from 'react'
import { Landmark } from 'lucide-react'
import { bankLogoUrl } from './bankLogos'

export default function BankLogo({ code }) {
  const [failedUrl, setFailedUrl] = useState(null)
  const url = bankLogoUrl(code)
  return <span className="pay-bank-logo" aria-hidden="true">
    {url && failedUrl !== url
      ? <img src={url} alt="" width="64" height="28" onError={() => setFailedUrl(url)} />
      : <Landmark size={22} />}
  </span>
}
