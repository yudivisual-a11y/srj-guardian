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
    echo "Mengaktifkan mode server nonstop 24/7 di MacBook..."
    echo "Harap masukkan password Mac Anda jika diminta:"
    sudo pmset -a disablesleep 1
    sudo pmset -a networkoversleep 1
    sudo pmset -a womp 1
    sudo pmset -a standby 0
    sudo pmset -a autopoweroff 0
    echo ""
    echo "✅ SUKSES! Mode Server Nonstop 24/7 AKTIF PENUH:"
    echo "  • WiFi tetap menyala terus-menerus (networkoversleep 1)"
    echo "  • Tidak akan mati/hibernasi setelah berjam-jam (standby 0 & autopoweroff 0)"
    echo "  • Sistem tetap hidup meski layar mati atau laptop ditutup rapat (disablesleep 1)"
    echo "Sekarang bot WhatsApp akan siaga 24 jam nonstop tanpa pernah terputus!"
    ;;
  2)
    echo ""
    echo "Mengembalikan setelan tidur normal bawaan MacBook..."
    echo "Harap masukkan password Mac Anda jika diminta:"
    sudo pmset -a disablesleep 0
    sudo pmset -a networkoversleep 0
    sudo pmset -a standby 1
    sudo pmset -a autopoweroff 1
    echo ""
    echo "✅ SUKSES! Setelan daya bawaan Mac telah dipulihkan."
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
