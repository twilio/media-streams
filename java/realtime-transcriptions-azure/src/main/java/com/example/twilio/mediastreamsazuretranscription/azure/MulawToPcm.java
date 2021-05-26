package com.example.twilio.mediastreamsazuretranscription.azure;

/**
 * This class contains a single public method for mapping an array of 8-bit
 * µ-law values to a 16-bit linear PCM values.
 *
 * This is needed because Twilio media-streams only produces µ-law encoded audio
 * data and some cloud speech-to-text engines only accept PCM.
 */
public class MulawToPcm {

    // The mapping is hard-coded here. It is perfectly possible to
    // build this array algorithmically, see:
    //   https://en.wikipedia.org/wiki/G.711#%CE%BC-law
    //   (note: that describes compression, we are reversing it here)
    //
    // However, we can save ourselves the bit-manipulation and just hard-code these values.
    // We use a short[] here because short is a 16-bit number so it's appropriate, not for
    // any performance reason over int[].
    private static final short[] mulawMapping = {
        32124, 31100, 30076, 29052, 28028, 27004, 25980, 24956,
        23932, 22908, 21884, 20860, 19836, 18812, 17788, 16764,
        15996, 15484, 14972, 14460, 13948, 13436, 12924, 12412,
        11900, 11388, 10876, 10364, 9852, 9340, 8828, 8316,
        7932, 7676, 7420, 7164, 6908, 6652, 6396, 6140,
        5884, 5628, 5372, 5116, 4860, 4604, 4348, 4092,
        3900, 3772, 3644, 3516, 3388, 3260, 3132, 3004,
        2876, 2748, 2620, 2492, 2364, 2236, 2108, 1980,
        1884, 1820, 1756, 1692, 1628, 1564, 1500, 1436,
        1372, 1308, 1244, 1180, 1116, 1052, 988, 924,
        876, 844, 812, 780, 748, 716, 684, 652,
        620, 588, 556, 524, 492, 460, 428, 396,
        372, 356, 340, 324, 308, 292, 276, 260,
        244, 228, 212, 196, 180, 164, 148, 132,
        120, 112, 104, 96, 88, 80, 72, 64,
        56, 48, 40, 32, 24, 16, 8, 0,
        -32124, -31100, -30076, -29052, -28028, -27004, -25980, -24956,
        -23932, -22908, -21884, -20860, -19836, -18812, -17788, -16764,
        -15996, -15484, -14972, -14460, -13948, -13436, -12924, -12412,
        -11900, -11388, -10876, -10364, -9852, -9340, -8828, -8316,
        -7932, -7676, -7420, -7164, -6908, -6652, -6396, -6140,
        -5884, -5628, -5372, -5116, -4860, -4604, -4348, -4092,
        -3900, -3772, -3644, -3516, -3388, -3260, -3132, -3004,
        -2876, -2748, -2620, -2492, -2364, -2236, -2108, -1980,
        -1884, -1820, -1756, -1692, -1628, -1564, -1500, -1436,
        -1372, -1308, -1244, -1180, -1116, -1052, -988, -924,
        -876, -844, -812, -780, -748, -716, -684, -652,
        -620, -588, -556, -524, -492, -460, -428, -396,
        -372, -356, -340, -324, -308, -292, -276, -260,
        -244, -228, -212, -196, -180, -164, -148, -132,
        -120, -112, -104, -96, -88, -80, -72, -64,
        -56, -48, -40, -32, -24, -16, -8, 0};

    /**
     * Converts a byte[] of µ-law encoded audio data to PCM encoded.
     *
     * @param mulawBytes byte-array of 8-bit µ-law values
     *
     * @return byte array of 16-bit PCM values. Each byte of µ-law
     * converts to 2 bytes of PCM, so the output array is twice
     * as long as the input. Pairs of PCM bytes are little-endian
     * ie least-significant byte is the first in the pair
     */
    public static byte[] transcode(byte[] mulawBytes) {
        byte[] output = new byte[mulawBytes.length * 2];

        for (int i = 0; i < mulawBytes.length; i++) {
            // +128 because Java byte values are signed and array indices start from 0
            short pcmData = mulawMapping[mulawBytes[i] + 128];

            // least-significant byte first
            output[2 * i] = (byte) (pcmData & 0xff);
            // most-significant byte second
            output[2 * i + 1] = (byte) (pcmData >> 8);
        }

        return output;
    }
}
