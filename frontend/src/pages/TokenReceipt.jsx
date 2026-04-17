import React, { forwardRef } from "react";
// import { QRCodeCanvas } from "qrcode.react";

const TokenReceipt = forwardRef(({ token }, ref) => {
  return (
    <div ref={ref} className="p-4 w-[280px] bg-white text-black text-sm">

      <h2 className="text-center font-bold text-lg mb-2">
        PAMS Hospital
      </h2>

      <hr className="mb-2" />

      <p><b>Token:</b> {token.token_number}</p>
      <p><b>Name:</b> {token.patient_name}</p>
      <p><b>Dept:</b> {token.department}</p>
      <p><b>Dept name:</b> {token.dept_name}</p>
      <p><b>Doctor:</b> {token.doctor}</p>
      <p><b>Doctorname :</b> {token.doc_name}</p>
      <p><b>Time:</b> {token.time_slot}</p>

      {/* <div className="flex justify-center mt-3">
        <QRCodeCanvas value={JSON.stringify(token)} size={100} />
      </div> */}

      <p className="text-center text-xs mt-2">
        Please wait for your turn
      </p>

    </div>
  );
});

export default TokenReceipt;