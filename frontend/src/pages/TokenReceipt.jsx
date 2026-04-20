import React, { forwardRef } from "react";
import { QRCodeSVG } from "qrcode.react";

const TokenReceipt = forwardRef(({ token }, ref) => {
  const qrData = JSON.stringify({
    token_id: token.id,
    token_number: token.token_number,
    patient_id: token.patient_id
  });

  return (
    <div
      ref={ref}
      className="receipt-container"
    >
      {/* HEADER */}
      <h2 className="text-center font-bold text-lg">
        🏥 PAMS Hospital
      </h2>

      <p className="text-center text-xs mb-2">
        Appointment Token
      </p>

      <hr className="my-2 border-dashed" />

      {/* DETAILS */}
      <div className="space-y-1 text-sm">
        <p><b>Token:</b> #{token.token_number}</p>
        <p><b>Name:</b> {token.patient_name}</p>
        <p><b>Dept:</b> {token.dept_name}</p>
        <p><b>Doctor:</b> {token.doc_name}</p>

        <p>
          <b>Date:</b>{" "}
          {new Date(token.date).toLocaleDateString("en-IN")}
        </p>

        <p><b>Time:</b> {token.time_slot}</p>
      </div>

      <hr className="my-2 border-dashed" />

      {/* QR CODE */}
      <div className="flex justify-center mt-3">
        <div className="qr-box">
          <QRCodeSVG value={qrData} size={100} />
        </div>
      </div>

      {/* FOOTER */}
      <p className="text-center text-xs mt-3">
        Scan at hospital desk 📱
      </p>

      <p className="text-center text-[10px] mt-1">
        Please wait for your turn
      </p>
    </div>
  );
});

export default TokenReceipt;