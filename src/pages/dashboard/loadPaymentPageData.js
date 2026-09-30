export async function loadPaymentPageData(api) {
  const [walletResult, stateResult] = await Promise.allSettled([api.get(), api.topupState()]);
  return {
    wallet: walletResult.status === 'fulfilled' ? walletResult.value : null,
    state: stateResult.status === 'fulfilled' ? stateResult.value : null,
    walletError: walletResult.status === 'rejected' ? walletResult.reason : null,
    stateError: stateResult.status === 'rejected' ? stateResult.reason : null,
  };
}
