// Automatic booking must never report a fabricated shipment as successful.
export const generateShipmentAWB = async () => {
  throw new Error('Automatic Shiprocket booking is unavailable. Book with your courier and enter the confirmed AWB manually.');
};
