const sliderImageExtensions = /\.(png|jpg|jpeg|gif|webp|svg|avif|ico)(\?.*)?$/i;

function shouldBlockAsset(request) {
  const url = request.url();
  const resourceType = request.resourceType();

  return resourceType === 'image' || sliderImageExtensions.test(url);
}

const sliderImageRouteHandler = (route) => {
  if (shouldBlockAsset(route.request())) {
    return route.abort();
  }

  return route.continue();
};

async function enableSliderImageBlocking(page) {
  await page.route('**/*', sliderImageRouteHandler).catch(() => {});
}

async function disableSliderImageBlocking(page) {
  await page.unroute('**/*', sliderImageRouteHandler).catch(() => {});
}

module.exports = {
  enableSliderImageBlocking,
  disableSliderImageBlocking
};
