import assert from "node:assert/strict";
import test from "node:test";
import { isMutation, isStoreDisconnect, semanticFailure, shouldNotifyError, successMessage } from "../src/components/notifications/requestNotificationModel.js";

test("store disconnect gets specific reversible feedback", () => {
  const config = { method: "delete", url: "/api/omni/stores/store-a" };
  assert.equal(isStoreDisconnect(config), true);
  assert.deepEqual(successMessage(config), {
    title: "Toko berhasil diputuskan",
    description: "Riwayat tetap tersimpan. Toko dapat diintegrasikan kembali kapan saja.",
  });
});

test("successful dashboard mutations receive global feedback", () => {
  assert.equal(isMutation({ method: "post" }), true);
  assert.equal(isMutation({ method: "patch" }), true);
  assert.equal(isMutation({ method: "get" }), false);
  assert.equal(semanticFailure({ data: { data: { ok: false, message: "Resi tidak ditemukan" } } }), "Resi tidak ditemukan");
});

test("clicked reads and failed mutations notify while auth gates stay authoritative", () => {
  assert.equal(shouldNotifyError({ config: { method: "get", bithinksUserAction: true } }), true);
  assert.equal(shouldNotifyError({ config: { method: "delete" }, response: { status: 500 } }), true);
  assert.equal(shouldNotifyError({ config: { method: "post" }, response: { status: 401 } }), false);
  assert.equal(shouldNotifyError({ config: { method: "post" }, response: { status: 402 } }), false);
  assert.equal(shouldNotifyError({ config: { method: "post", notifications: false } }), false);
});
