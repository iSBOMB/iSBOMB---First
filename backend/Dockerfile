# 최종 해결책 1: 파이썬 버전을 3.10으로 업그레이드하여 최신 문법( | )을 지원합니다.
FROM python:3.10-slim

WORKDIR /app

COPY ./requirements.txt /app/requirements.txt

RUN pip install --no-cache-dir --upgrade -r /app/requirements.txt

COPY . /app

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]

