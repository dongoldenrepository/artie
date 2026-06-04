#!/bin/bash
# Copy missing images from artist-catalog-images to artie-don-images
set -e

SRC_BUCKET="artist-catalog-images"
DST_BUCKET="artie-don-images"
TMP_DIR="/tmp/don-r2-copy"
OLD_CONFIG="../artist-catalog/wrangler.toml"
NEW_CONFIG="wrangler-don.toml"

cd "$(dirname "$0")"
mkdir -p "$TMP_DIR"

IMAGES=(
  "Aquaduct1913_149DGoldenWMTH.jpg"
  "ArchesNotreDam1913_195DGoldenWMTH.jpg"
  "artwork_1780064148160_r2fvgs5wi0g.jpg"
  "artwork_1780165441876_uvgnxp6qpoe.jpg"
  "artwork_1780058982802_sobpvu3707i.jpg"
  "artwork_1780163151963_ebiwpkukjzr.jpg"
  "artwork_1780060062925_k0p3ynbzppq.jpg"
  "artwork_1780063454125_2nziff5r4fd.jpg"
  "artwork_1779898659283_3czwhfwk8j1.jpg"
  "artwork_1779898277139_2ski8twyptl.jpg"
  "CleanMachine2416_250DGoldenWMTH.jpg"
  "CupRacer1114_179DGoldenWMTH.jpg"
  "artwork_1780064288376_8j8mywr33qj.jpg"
  "artwork_1780062877869_wxn0g2l5ovk.jpg"
  "artwork_1780059717228_tup17sgmb59.jpg"
  "artwork_1779899657780_yypheiqxni8.jpg"
  "artwork_1779916595063_fsf2xgrhtts.jpg"
  "artwork_1780067451863_bdbop5j1f7.jpg"
  "artwork_1779898566259_pdidw2w651.jpg"
  "artwork_1780063737166_abzomri980s.jpg"
  "artwork_1779898887101_g6yolnxof1a.jpg"
  "FortressPortal1913_150DGoldenWMTH.jpg"
  "IMG_1483.jpg"
  "artwork_1780062685009_h9goflv2e.jpg"
  "artwork_1780165525850_iitqi8zy3f.jpg"
  "artwork_1780063842336_fa1t70px27v.jpg"
  "artwork_1780063957788_o343jdylb1o.jpg"
  "artwork_1780165206863_kvnb3mnrrd.jpg"
  "artwork_1779898382232_2o5fxv9uep4.jpg"
  "junior.jpg"
  "artwork_1780062260659_rbi8c0yvh08.jpg"
  "artwork_1780164734971_r6yv0vvzhgd.jpg"
  "artwork_1780064603014_malueh738k.jpg"
  "artwork_1779899729853_zwl9msnrfx.jpg"
  "artwork_1780165279007_9xnr06g2den.jpg"
  "mywings1218_195Dgolden.jpg"
  "artwork_1780063621323_r5qev2zgr4e.jpg"
  "artwork_1779998172015_zh57wmi70g9.jpg"
  "PeekingDuck1208_119DGoldenWMTH.jpg"
  "PepperandSalt1913_124DGoldenWMTH.jpg"
  "artwork_1779899911204_8wnnytcv6hs.jpg"
  "RanchButterfly.jpg"
  "RanchWindPower.jpg"
  "artwork_1779899788546_wqzh8ih4g1e.jpg"
  "artwork_1780067051185_rdwcipa3uwf.jpg"
  "artwork_1780165086993_ctsttqmc06.jpg"
  "artwork_1779899611090_jahy5e8xkl.jpg"
  "artwork_1780067266137_7o4ttlofmho.jpg"
  "artwork_1779900042302_2u51u3gsya3.jpg"
  "artwork_1779899842962_w1he6pq6zx7.jpg"
  "TexasGold1812_199DGoldenWMTH.jpg"
  "artwork_1779898629567_azoc01ykmnh.jpg"
  "artwork_1780064511387_u8915s6460g.jpg"
  "ZooZoom.jpg"
)

TOTAL=${#IMAGES[@]}
echo "Copying $TOTAL images from $SRC_BUCKET → $DST_BUCKET..."
echo ""

COUNT=0
for KEY in "${IMAGES[@]}"; do
  COUNT=$((COUNT + 1))
  echo "[$COUNT/$TOTAL] $KEY"
  TMP_FILE="$TMP_DIR/$KEY"

  # Download from old bucket
  npx wrangler r2 object get "$SRC_BUCKET/$KEY" --file="$TMP_FILE" --config="$OLD_CONFIG" --remote

  # Upload to new bucket
  npx wrangler r2 object put "$DST_BUCKET/$KEY" --file="$TMP_FILE" --content-type=image/jpeg --remote --config="$NEW_CONFIG"

  rm -f "$TMP_FILE"
done

echo ""
echo "✅ Done! $COUNT images copied to $DST_BUCKET."
