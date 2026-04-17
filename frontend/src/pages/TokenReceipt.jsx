import React, { forwardRef } from "react";
import QRCode from "qrcode.react";

const TokenReceipt = forwardRef(({ token }, ref) => {
  return (
    <div ref={ref} className="p-6 w-[300px] bg-white text-black">

      <h2 className="text-center font-bold text-lg mb-2">
        PAMS Hospital
      </h2>

      <hr className="mb-3" />

      <p><b>Token No:</b> {token.token_number}</p>
      <p><b>Name:</b> {token.patient_name}</p>
      <p><b>Department:</b> {token.department}</p>
      <p><b>Doctor:</b> {token.doctor}</p>
      <p><b>Time:</b> {token.time_slot}</p>
      <p><b>Date:</b> {token.date}</p>

      <div className="flex justify-center mt-4">
        <QRCode value={JSON.stringify(token)} size={120} />
      </div>

      <p className="text-center text-xs mt-3">
        Please arrive before your turn
      </p>

    </div>
  );
});

export default TokenReceipt;