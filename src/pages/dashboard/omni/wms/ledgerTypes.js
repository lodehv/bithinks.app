// Label tipe mutasi Buku Besar Stok (jargon gudang → bahasa user).
// Terpisah dari komponen agar bisa dipakai bersama tanpa mengganggu fast refresh.
export const TYPE_LABEL = {
  masuk: "Masuk",
  keluar: "Keluar",
  alokasi: "Alokasi",
  lepas_alokasi: "Lepas Alokasi",
  retur: "Retur",
  opname: "Penyesuaian Opname",
  koreksi: "Koreksi Manual",
};
