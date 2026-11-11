#!/bin/bash
# =========================================================================
# SRJ GUARDIAN — PENGATURAN MODE SERVER 24 JAM NONSTOP DI MACBOOK
# =========================================================================

echo "=========================================================="
echo "  SRJ GUARDIAN — MODE SERVER MACBOOK NONSTOP 24/7        "
echo "=========================================================="
echo ""
echo "Pilih opsi pengaturan mode daya MacBook Anda:"
echo "1) AKTIFKAN Mode Server Nonstop (Laptop bisa ditutup & tetap aktif 24 jam)"
echo "2) NONAKTIFKAN Mode Server (Kembalikan ke setelan pabrik Mac normal)"
echo "3) LIHAT STATUS DAYA MAC SAAT INI"
echo "4) Keluar"
echo ""
read -p "Masukkan pilihan [1-4]: " pilihan

case $pilihan in
  1)
    echo ""
    echo "Mengaktifkan mode server nonstop (laptop tidak akan tidur meski ditutup layarnya)..."
    echo "Harap masukkan password Mac Anda jika diminta:"
    sudo pmset -a disablesleep 1
    echo ""
    echo "✅ SUKSES! Mode Server Nonstop AKTIF."
    echo "Sekarang laptop MacBook Anda bisa ditutup layarnya dan bot WhatsApp akan tetap siaga 24 jam online!"
    ;;
  2)
    echo ""
    echo "Mengembalikan setelan normal tidur MacBook..."
    echo "Harap masukkan password Mac Anda jika diminta:"
    sudo pmset -a disablesleep 0
    echo ""
    echo "✅ SUKSES! Setelan tidur normal telah dikembalikan."
    ;;
  3)
    echo ""
    echo "--- Status Daya Mac Saat Ini ---"
    pmset -g
    ;;
  *)
    echo "Selesai."
    exit 0
    ;;
esac
