import { useEffect } from 'react'
import { fetchEventSource } from '@microsoft/fetch-event-source'
import api, { getAccessToken, handleUnauthorized } from '../../utils/api'
import { walletApi } from '../../utils/omniApi'
import { followPaymentStatus } from './paymentStatusSubscription'

export function useLivePaymentStatus(paymentId, watching, onPayment, onError) {
  useEffect(() => {
    if (!paymentId || !watching) return undefined
    return followPaymentStatus(paymentId, {
      stream: fetchEventSource, url: api.defaults.baseURL.replace(/\/$/, ''), getToken: getAccessToken,
      getSnapshot: (signal) => walletApi.topupState(paymentId, signal), onPayment, onError,
      onUnauthorized: handleUnauthorized,
    })
  }, [paymentId, watching, onPayment, onError])
}
