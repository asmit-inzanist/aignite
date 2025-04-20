import io
import tempfile
from PIL import Image
import fitz  # PyMuPDF

def input_img_setup(uploaded_file):
    if uploaded_file:
        if uploaded_file.filename.endswith(".pdf"):
            with tempfile.TemporaryDirectory() as temp_folder:
                images = []
                pdf_document = fitz.open(stream=uploaded_file.read(), filetype="pdf")
                for page_number in range(pdf_document.page_count):
                    page = pdf_document.load_page(page_number)
                    pix = page.get_pixmap()
                    img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
                    images.append(img)

            image = images[0]
            with io.BytesIO() as output:
                image.save(output, format="JPEG")
                return output.getvalue()
        else:
            return uploaded_file.read()
    return None
