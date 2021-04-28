/* eslint-env browser */

// @ts-ignore
import CodeMirror from "codemirror";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { CodemirrorBinding } from "y-codemirror";
import "codemirror/mode/clike/clike.js";
import 'codemirror/addon/lint/lint';
import __fragmentShader from "./fragmentShader.js";
import * as THREE from "three";

var container;
var threeCam, scene, renderer;
var uniforms;

var gl;

var editor;

// meow globals
var geometry;
var material;
var mesh;

var socket;

var isDirty = false;
function initYdoc() {
  console.log("in init doc")
  const ydoc = new Y.Doc();
  var room = document.getElementById("room").value;

  const provider = new WebsocketProvider(
    "wss://demos.yjs.dev",
    room,
    ydoc
  );
  const editorContainer = document.createElement("div");
  editorContainer.setAttribute("id", "editor");
  document.body.insertBefore(editorContainer, null);

  editor = CodeMirror(editorContainer, {
    value: _fragmentShader,
    lineNumbers: true,
    mode: "x-shader/x-vertex",
    gutters: ["CodeMirror-lint-markers"],
    lint: true
  });

  const ytext = ydoc.getText("codemirror");
  // const undoManager = new Y.UndoManager(ytext, { trackedOrigins: new Set([ydoc.clientID]) })
  const binding = new CodemirrorBinding(ytext, editor, provider.awareness);
  const setDefaultVal = () => {
    if (ytext.toString() === "") {
      ytext.insert(0, _fragmentShader);
    }
  };
  if (provider.synced) {
    setDefaultVal();
  } else {
    provider.once("synced", setDefaultVal);
  }

  editor.getDoc().markText(
    {
      line: 5,
      ch: 1
    },
    {
      line: 50,
      ch: 3
    },
    {
      css: "color : red"
    }
  );

  // const user = new Y.Map()
  // user.set('userName', "userName")
  // user.set('base64Image', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAATYAAACJCAYAAACmVxS9AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAAJOgAACToAYJjBRwAADCkSURBVHhe7Z0JnFxVmfafW/vSe2fppBOSkIQEMCExBJAgMAERGBCIICMCI+CMgjMoqPBzlPnmp/Kb0ZHRGWfA+RTwA1ERWUQEEQwIhB0JICEhe0LW7vRWe9W9Vd/7nKrbqe70nu4QK+8fbqrufu6tPs993nPOPccCUJBJURSlYvCUPhVFUSoGFTZFUSoOFTZFUSoOFTZFUSoOFTZFUSoOFTZFUSoOFTZFUSoObcemYOpPOuUvgX8KilIZqGNTFKXisI5ZdJw6NkVRKgoNRRVFqTg0FFUUpeJQYVMUpeJQYVMUpeJQYVMUpeJQYVMUpeJQYVMUpeJQYVMUpeJQYVMUpeJQYVMUpeJQYVMUpeJQYVMUpeI4IO+KVk2djMYPHYvqeUej4aijUNN8GPyhKOD1IWmnkZEpnuyEFUtgzxursOelV5F59Q2kt+8oHUFRFGXojJmwBRvqMOviczHzvDPRsGA+Op0c0vDC6w/JGT3IxdNwslmkMim0xzpRN3kcMjkb0WAUAcdCy/r3UNvWiR1PPoGtD/4a6ba20pEVRVEGZtSFLdjchLmfvwoLr7wEYZ8PQb8Ptkx7Cjl0ODZyPj9y+QIy8STyImyW7SCTSpqYOGx5UeePIpguIL2zA4VkBjXRMKr8Qaz6xX1Yee9PkWprLZ5IURSlH0ZV2CZd91nMvf7zmFRTh8ZQBFVeLwJwYHst7MinsdvJIuGzkCsUUMjaCIjASQyKgDi1zJ4OjAtEkW+NIbZpJ1Lb2/DCU3+Es30zkM4i2jQNiVgS2C3z2zaUzqgoirIvoyJskYVHY/K/fRXV849BlScgriuM8aFqNIpTq4GNgg/YUchgh5NBp7eALPLw5vKoFp82wRtAVSqH/K492PLaW/jjrx5B1/IVQDIv9i8oKcwBmQyQE08nYglbvk9qQMSOI7nlvVIKFEVR9rLfwtZ82TLMvO1byFp+ZLNyqJSNUN6LhlAVJoowTQl64fNb2C3ObZuTQKuIWyqXgTedQ61dwBQrgIm2hd/88A689eO7gK404A0jIiFpsr0NVm0IBVvELeXAkpDUJNaTBRbPwQSPHHf5iyYdB4oHH3wQRx11FFatWoVly5ahIO7zQBAIBHHeRZ/EpOappSVFHn3oV1j37juluZ70tc+ObVvx6/t+br5z3eaNG/Dy88+Y+dFi1hFH4uzzLyzNAbGuTtz30zvN93g8Zj7LaZrUjPM+8Sm8/sqLJi3c/8NLP2L26Wv7saD3vXLTXH7+4048GSecdEppbuB7r7y/7JewLbju77DgW19DV8CLhNeDZMZBJu0gL24sJE6sXpZNFaMVFnFr8+axK5NAh51FLptBJOtgvGNhXrQef7j9bjzz3z+Sv6Y0ApYX2bZO8XIiiAEfsraEn5JKvzjAXCqDYFU1Mk5K3FsOk//+Yvi37cbmux4tpWjseT+Ezc1QvTOSmxkJxSor99Wlt1i4nHTq6Vj56kuybXZMhI1pPXr+gh6isGDRcdi5fZv5vnPHNrNNw7hx+N3DD5hlvXk/hI33q2lyM1a+9rKZZxqnzTi8+77yXh+35GS8vOIZM8/tzxLxfkx+E16TcnAx4nZsJ1739/jIzf+EGnFl1V4fIiJEVaEwotVRBKojyImYxa08NrW3Ymv7Huzq6EB7LC5RZRbegkf2i6CpqhZtG7bgmR//BGjZA4+sy7btQWNdlbi8ggSs4tR8FoLRMHIiihKPwknLp+OI2Pmw/cmnMP3ipZj59+cWE1WBMJNTKO649fv7uANmsPvu+YkRp6Vn/nVpKVAl4n/WeR/HHx77zT6i9dzTT46ZWDDzUwzefnNlj3NQLJj5D2YBYNpcUSNbNq5HVU0tGhrHmXne6+eeesJ8krY9rYiLqztsxkwzrxxcjMixLb7sE1j2v7cgJ44q7vEgISKTgA8dsLFLfuzOdBpZio981uVseBwbMZGptAhdwSeiJhmgORDGFAlZ1z7yOJ7+5r+JsHXIkT3w5GU/CTHzBflk0sTBwRL95STrfeLyHFle8OfFCjo4+itXYsZpi/Gnf70L2+8fPedx66234rTTTivNoduhPfDAA92ObefOnVi6dGn3+gsuuMB8v/HGG3HllVea7y7Lly/HNddcYxwej3H00UebfcisWbMwf/78fdyf68hef+UlI2quCwvKw2RP627JWF34w+8ekcyWxVkfW4aXxE24jqjcbfSFe2yKIt3TEXOPNstffO6PPcTwTDmuuy6TyeDXv7zHnMPdf4c4sUnidBrGTTDrFiw+3mzb241xe8J9ykNjnm/Vm6/jokuvwLPLnzDX2ZdjK09H7zCxd+g7GiEi7/VpZ50j1/SzPh8EvX8b4jprUn6vlAOPqAb+pfh1aExeOB8X/7/b4FgWsvkCUhJ2dqXSiGXS6Ewk0Nrejs7OLiTkeyaRRLBgSejpyHaOhKpZCVWz4rqy8EhY6Y0n0bLqXez4wx8lJX4glUIkHIZdsFEIiJD5fZAZUV/RX457KZMnb0GiWtE8ETf5L1sdQn3zRNR8dBFaXvgz7JbOYkL3A4abxx9fzKAuLS0tuPfee3HxxRdj/PjxZpoxY0ZpLcx8NBrFihUrcOmll/ZYRzgfiUTMeh5jwoQJ3cdx5CFw2223lbbcy/gJTSIaU/DaS88jHI6IqF2Cp594DI89fD9Scm/nHj1PRGGl3LYkZsw6AoFgCNu2bsa8hYtM6LdlU/+1x15x2dz/yA/Mx0vPPWOOuUeu8cRTTsO2LZtMZqbza2gcb1whRdPr9WL+B4/FujXFjMz9p82Yhd8/8hD++OTvzD4U2+NPOhWHz5pttuO1EX5yWvXWSv50SCYTuOeO/zXppUgcPX+huKQNxgnxnNPECfHaKNoUNcLtmQ5uf+wJS8zxeY9OO/tcIyJ/ePwRbN6wXv5OgM6OdrPPSDlJhHXbli3YuH5taUlPZsw8QgR6ijwEnjXXRXFlmu65/Yd4Vpxdy64dZnlfoqiMPcMORU/+P19HV7aA9lQOe+IZ7G6PYfvOVmx/bydat7cgvrsDqdYO5GQ54mnk4zaQyMNKikDF5Y+7K4tUewKx9rj88cUxsWmyPB6bzFsIEBGE7SCfln0c/vWL+Bkhk+VcR0GTifNBW5Ke86Bz1UZ0bW5B++42WJfvLdgdKZdffrlxUIQua+7cuTjnnHOwfv36Ho4qFovhM5/5DK666ip0SWYm06dPF+21cPXVV2POnDnd09tvv23Wn3DCCebThZn25ptvxrx58/Zxa6SqugYZcVymTEcEbsf297rdQTzWhbbWFnMM0tZabN/HTF8t+3HdUHh39dvdx6QQtokTdMMrZkqGri4MzwLiFgOBQGkJxPGt6+FK+P3O2/7TfP/cF2/oFqWRQufUOG48nhM350KHx3R0h4nyUOX9IDz/QII+EHRc195wk5nWrX5nnzCeafnsF24w62fNPdIIfrkjZhrc34NpULf2/jEsYTv+C9di0rGL4auulTCwGghGkcwBHbGUPGljSHSkkE9K6Jly4JfJlyrAFiFzEg4sETdfypIJ8GVEpDIFOJk8Jk6cjKbZc0X80ggHIyhkHAQl/KwOVckZWYUg4amImkVxk8m4N/5LoSuI4WyRPyY5txPPId8kf+gXLjFpHSmTJk0yGZfCdc899xjBWbt2Lb785S+XtiiydetWPPfcc9i1a5fZthyK45tvvok1a9aYiWFnX6xbtw533XVXaW5gGiRzu+JFykWPMJwsFzNuPxTKj9kX5Zn5E5ddaYSznL72Z5qY6VkuSMd5xeeuNe6P03DhdTZKmHvlNV/sFh1+5zKuo8PLStjHZRSmgaDIDiS0FLL/+s43zUThctPtQqH63//8jllP4TMCJ07NrJOHDtNDMXeXKe8fQxa2qsmT8cGrr4EVisgUhSdSg4KIj+0NI+P4WZwGmy01cl5xU34jYIjZyLSnkOnIwOmUDNiVk/AzbyYrmUdBxK+jtRPZtIQrIpQhXwj+gg/VvjAKCdk27zUCxsknosaJzo1hcM4j3xmediVhd6YRynowoaYR1ZeeLTFcXTHRI2DatGnmk2JF0RouS5YswbXXXmvKwbZv345zzz2327HtDxQtlptRWDgtXHy8cWb8zozE73QJFJWYOAcK3f5CoWCZHsM8ZuZf3n1HD4cyGHR8DB/pZI6SUJPTSGCZGkXSFR13otMsF1FWslCEKcb7C8sI6ZD7SzPPzbI8/g78DXitd/7wv8w9Ou2sc/cRReXAMmRhm3/lZ0TEfKDRzspu2QInH2Li0Nh+1pawMC+i5hGRCxQC8Of9rMREOptHMp1DOmUjJ0LmyJSXyZb5dDKLFSteRNvKtxCpqkU6Y8PrDcDy+CQKzcCS8zmSQuqZJZGaJWGoyKEsE2HzykKKm7i3goTFPjlm1AkgVJDznn2iSfNIePHFFyWzZDFZhPz6668X7bQwe/ZsfPe73y1tMTCHH364ETUK40033WQcX13dyISWLoBhGDMqMxIFi47giqu/YMqaCOdZ0P7Yr+/vFp2Vr7xkCuj3J4Mzs1JIWbO6PyGVK7QjxYSY8hvQDQ2EKyxs3uJWYPSGYtVfE5PRwnV1A4miMvYMSdjCDQ2Ye8nfQHwXulISdnbF0N6ZQFdnErHOFGxROy9C8IqgwRFxk0+vFUTBI07OxzZuFpKSwdNOHraIkyNKlbMLEko52L1dXFHORjKRQNYrYinbp+XTCoszjIZh+yzYnr3lTxS5PFMty+GTLyJ+cjaERVjD4hgDkre9JywAqiPFHYYJQ0OGiIQ1nqtXr8YjjzyCmTNnGpEbKtXV1bj99tvNvs3NIxMYZta1EvJQuCg0zJR0Ksw4dGd0Kpxnhua2Lsxcb7/xugkde4dFbMc2FCfhChJDMsLzu+noD65jqFd+fIorRZblc5xcXLc5GLwWNiouPzc/T/qr4jyvr/waR+pU2dau/EHAYzKMZnke4Tpu48JrZJpYK8p7Vb4/08XrU94/hiRsc87/mLipLrR3tJg/sq0bN2Lz+g3YvGETHBErr9cvLiVsPiVOhJPLy+QgI1Pe45VFHhG0AvIiapY5JZtsWMb9zVi4ENWnnipq5SDc2IBUPicuMAaf34NcrJObSvRJQSmIYEoIy9oDizVt8inLJAGmhq8qUoWG6jpMrKrDhGgtQicukvUjg802eoePbNoxFO6++25T9ubCCgi3WcdIYLkPBYYurbcD4/zSj+5tv1YO93PDIrdsihPdaLkIDgQL7Jm5uR/Pv3b1qm5X2BfuuvLyMIaybiNW1/lRLNzyqMHKxcjy3/3WfHJ7HpOfO7e9Z85HR1d+jWQkriwuDpsPAvc4FK3yJiU8z8LFJ3Sv5zW6zVOK6/fuz/SNxRsdytApKsYgfPbR+1A1by52i1Pb3dIhoWUeGQk1kxKKemrqxVFJyChilk2kzHudBSdn+lhL2znkLBb/e+Fnsw1xZpbElKwA9fgKCOazaAr4sPmFF7D9zrtRNWEC4hvWI+IFgiGfadArjz/ZNihOzBbtEykUR5cXB2izFpGOTY41/28/iemnnIBcXRTtSXGSqSQS6zZj89e+X7qCv3woYm4bNhdtK6UofTOosPlqq2Fd+FHkwgFEG8YhFKwWBxVC7bhmTJ51JNolNrTFqTlOAXYqAyuVFmHLivBlkHFs2daPgDcgIiYnyuXEuckyCS0L3jx8hRzq5PS5997D2h/fCbS0wvJY8KWTEtbmEK4SoYonZZnfvIIlB0BOhIzlbqZ1FNu5FRwcfdnFmHzyYrRYtsTNARMyt7bvQduNP4BjGv4qinIoMWgD3XxDLfJdEhLu3I3c9hakxAml1m5CR8pG1cQpyPuD4p5EH41widxkc6I1EooybJQQMuD1Iioug5Pf6zGF6Y6IUV6cm0d01RYhnFBTh6QIV3rjViAURT5rwxaHl5ZjGXsnYWyYIa+kJyNOz/GKFrPyQI4ndg4xCUetumqkAh50BeW4E2rgRP3IbdoBe526GUU51BhU2MJHH4XqRceift4C+KcchnxjE5zGifDXjkPduIko+ENw+NoTfZ+4NoabLEzjWwGstAyJq4qGgqgSYePJnLwDW4SIWkiioTAKGRHDtI3O1WtFGB3UzZyNplmz0ZFIyhZyYDlmUMSNQW2Srx0YYWNZnUwisHY8AYyrR82UichGJSyOBhFqrEGhM47kMyvNeRRFOXQYVNgaFiwUEWtAtKZWtCSAuup6jB83SQTKKy4rj0h9o6kIMGX5Imwe1hCIeFHaLJl8Vh5hcW1+ViKIoGVyWWRtESPRJhaTmRoFmZk2+TCMn30kZi9ajCWnLjWNgDesfbcYLKfT8IuweUTM0j5xhWz3Icc0bydkZTYQQrKjHZlQQARxBgK1Vcj7PObVrfjDz/IyFEU5hBhU2KZ86GS0dHaJGIkoSYiYSeVMmMi2aZ5gGNHGcaarb9aOWqJUFt1Y3pZltgiXLfM5s9yR/dOZDFJ8X1SELSehqiPLPVbx7QKfuL5IpAqRaJVolYXte1qRZhldJgUnHhMnKPLps5BlOZpp1OYFvzYGqozO5To7kY3FkJBjBgJ+1NfXm/Pu+cXvS1eiKMqhAuO5AYlEq8UNdYr7ySDi95sKgISISCoeNwLm8eTFdOXEweW6e+TIi6DY8t0W55aTMDIt+8aTCcRTSWRE6ET6GGCa7TKm5hToyGXQmk2hRT63dHXAqq/DnGMXIVRXa2pGM+LWch5JrnGGQNC2EBLHaCclXE2mTLs5bO9E4uePYdPtD6JzxZ8xzcf2VKWYV1GUQ4ZBhW3G1KnwizikuroQb+9ArL0NyXgXCokuJGId4rjoniTwZI8cVB02pmWtpyxjQJq3LHFveRE0B1lxaWKyxHmJR5PJy0nEMisCaYt3zLKeICLiGQ0gPL4enY54t2hEVMwvx7TMGwdFYbMQYDQqx+MRPQx5xUGiMyUiJ+d/cz3W/eIR5FZtLcW7iqIcSgwqbFObJkqY14GACFg2GUNURCafS0MsG2z5tETAMpmkCIyDWKJTXFoWaVvCR8qa6BDf60w7ErqyfE2O54jzomPLi9jlZVlOjkERlAAXji+PtCcHb3UAfpnmLvwAPnTGUnjHNcieBXFlxXI1j0wFhr9yVr5+leG+Iqwh+e5ns5C4TBtb8MId95prUBTl0GJQYUu0tcHnFdeViCPTsgupWCeCfJ2JYWdnG9IicHRreXFdFJ+CcXCWqfU0rUDkn7wlYsa3D8T5sWEtA1Y6KYsOLptFVsQtbaeRymeQzMt3ZCXslBDWstHlFfGqjgK+AMT6SYLlPx6LQiuH4ZsK9IqSAjlPHj45h3g+oD0BZ+vQuu5RFKWyGLTy4E9r3kV+5040zJyOnAgWKwHsrIgY25hFIgiJo3M8DAZFzJw8Aj4/bFsclAgPy9A8BZ8RN1v2ZVhqAkOKmmzrkU+vCBL3Llji8VhWxzI4mfK2CFYug4S4wY5du2G/1wp/Km22pYDlfLKPCCxdIQUUfhFPn6wVEZbDSnQsvlBE04THiqIcUgzq2LBjJ40YrIyIWSaLgHwP+8U9iYAxLEzHEiJQIiYieAWZd0T0+GnqEfi2uuiKVRDBEQWi4PANhXzxTXhY8snaUC8rBQS6uZSIWjyTRkc8jpZYF7pE8AKN9fCFQnIoEUoR0OLL6HIwyjLdo1++sMEuQ1IRvYKInN/rM6sVRTn0GFzYKGKBCDIdMUi8iJAEexEPuxZit0R8PzSDgMXvsq1M7DxSIlPRGBEghxPdk0zG0YlTy3OSE8ty9oRrs/lI2jG9fbAawLF8sqsPWVmXFOFLSgq9tVEUAn7jvSwJQ3ksI2ycxJmV1FNmKZji9tjcRE5C16goyqGHqxD9Y4mwVdWjfs4s+GqqJOz0Iy1eKElNrK6Ff/YRmHLUPHQk0hJyeuCje5Oj2j7uXDAvv/MEaW+xHKyQz8MvC/gmQUCcVzaTEmNXQNZXLCMriNXzcpss28VlxR46sN7bjo5fPQls2IKonDaXTyEXkG2pkNQ1031R0UFSbLuvyIjewJfXF+x6xx04xKX3ICf7C3u1GGzAFcLucTjQCfv3Guu+xEYbK1SFcdfcicDMxaUle2n70TVIrRzesIkNV/4A4UU9RyTr+u33EHu02BX5gSa84CxULb0Krbd+GoV0vLR0cALTF6DxH+6CJ1zs2ij12iNou+Mf5dvw/1YHovrsLyA098OSviskfUPr0aVSGNSxsYMhnzeMXDwtN4cdRWaRZ1jKN9HFreVk8krIacm8hz3eynfzKfOWuDbWYPJtBC/fHOAkvx1dm09OzWH4Qr6whI1BOY84Ndk3J1NW9suK28vIxG6PbAqXX9TS6zFlavIvonJ8H2sPGJbSyom788qyiOM1L9yLyso/I/9DoZC5PbW6vbMOpYud0cbtQHGsRY0C+qkrP7tP10gjhZlq8i1/Rnz5ndj2+ek9pu1f+oAIwhUYf/2vRPzY1nBgKCDN/7MJuZ3r9jmWv2kWmr75PLx1k0pbH9xQ7CmGu791Rve98NY1yf26trTFyOA9Gur9PBQYVNjooOxUF+xM1rT0d5J8rzMHvyPqwfdC2ThWhIsSWGAvHxKm5hmqFnwmDC02aysKmkeEjKLnyftEhHwIyGdQtguIgPnEaXltcWecKH4sd/N6UfAxNPUWNcpDN8gveXjYpk2++lmSxtBXHJ55CV8WyhomZ9SguHCszNHobvtQgJks+qFPYOfXTujTldHdtPzHRUivfhb1l/xraWnf0N3UXvh1tPz7+X06Mzqdzvu/adwcReNgh9fONDsdxf79OB9ffrtxVn8J6f9LgeXrA9aKGkSVvJF6+ANR0Qs21xXP5Nhw0kn4GuswZfZsxCVEzYr78lXVGoHju+rRgF+MloiNiJHjETHzhUSbgqbb8Cg40HIIIXFWEXFk4stE1LLwSnhp5W3T+NYX8iPSWItIroD466uB3a0SvjpixmzYEiGzyQcHeTENPOT8BfYLJ3OsfS2q3ciYNedIpJJJMzScS/PUaQhHIt1Dz9HZfOqqq7HklKU4fskppmLE3Z69r5530SVmKLqLLr3SbLPg2BO6h7UjPF5dfT02rltrxqdkx4vl5+MxTjvzHDMkXfn6orP6nBnA5NSPnInTzzrXnJ9D53FgExfuf6mkj+uOmrdAclDBdJ5YPiSeC7dlJ4mRSBRHH7PQbL/OdCqZ3ec6D5t+eJ/HcGHmrPvEN4wIZTetNMI04etPoPa8G1Hz119EeOFZCM07Hdm1LyGz9kVEFp8Hp2Vzd0bvTe2yryP9zrNIvfJr42wmfu1xEbp/NsIZPPLDsu8mZFY/h5B8Ry4LW1xdXxTT8fvudNDppV4viq573LyEa0x7/aXfMdvY29+V4+0dfo+CPfGmJ2Tddeb89s534Z90BJKvPCR/bgwfRoa/aTYCMz444HF6pz8096Ri+mX7hiv/GzXnXA9vw2RUf/Sa7msLzj4BvnHTULAzmPDVR8v2e6z7PPy9xl/7s+5rLl/P6x33eQ42lMf4rzxUOu5jxo2P/+IvzH2g+8y++0K/v9/7xaCOzSA3hmVhScmUGcnweZs1nyIcmSTsWKc4MBtV0TC8fi9S2YzcBpEavzg3+ePn+53+iB/BsIiaV1yciE8gGEY4HEVEPusjkhF8ATRIyDkhEECjiGF10IPaujCapoxHXWODeX80GAoXXZz8z3oKCYiNmNCamRGrzKUwdJXgWQSvr+HsRgozNzM8xxJw5886/8LuQU7cUJUC4VJdU2sG+uBQdNyGYwewo8jeoR7L19jbqjtQiwu75Oby/srfPrz0DNODK4/NsJmi5XbJbURRBI896HI9e4Jl76/9wV5geQ0chJn7uF2N8zjlg7lwYm++FNrytJbDP/68uJC0iA0Fo+Gq/0HHT2/oDh1jv/2+EQNCt8IpeFTfwyZyf07J539pMiBdWeKFX5rjtN0uGXgyj1O05gxTwx9kb8J9W/XAjIXY89+Xm33pJDnPjFtO7cf/GZ0P3Gy2Ydld7ce/bs5PuG3dpd8W57jMrG+5ZZlk6r8z6/YXppvCwHvRFzx34z/cLen/W3NuTk7HDoy75idyX6rFAf4D2n50NbLrX5XQdp6ZdwnMPFZE/5Tu6/bWT5J0Fwfz5j1lGSidc/lxy100xTIwY5FZx+OGF5xZcuMnFpf9+JrSlgcXQxM2EYlCrAW5XBy5fBLJZDtye3YALaLSTg7tHXuQjXfBm+Pwe13IZxIifDlknSzaM13oyMbQle5CV7LTTDEJbWOyTUyekF5xg0FxZ7XyBznB70dDwIsqcWPBKg+qGsIiaOIEsxxZXkJgcXOs7WQ5m/n7NRGqCBjDUyNkxU/LtDXZPziid3k30RwI1+2ploOFcEwBd94NVd3xAQh7t6XwuMLUe8zOcjgWQJUIoTtOJgWKg7iUjxHQGw5aUt7VNs9DV0fBoaCWr2f6mJbh0NdxCLsLLx/Tszcs63IFKzB9IbIbX5dwVBxACWac3I53jfgRClJ/UFS4HaeiYCYkbLvDrKMQOG3bzSehuxqI+FN3GgdJuE9245/gM8K4l/jyH8s2xTEOks/fK+eTv2lJAwWAzoQho7uex2AIvL/Q/dCtUVD7onjuK3ukjXB7K1wt92Xfv6dyeI/cYzPNfDAUw95q88mMxOty4XffpFndgp5PxXqsJ077ju7fLyOi6N7Xg4mhCRsRIbJF1Ox0m3xvBybUAEuOhW/qRBEtuXgRvkAhhVAhDW8mJjckDvbswTK6jAhTThxfwc5J6OggKyFDIptCip/iANnoNyBJCYlriwQDCEWDyIctJD0iChJ6xjrbUUhICCcCmKOA+SU9DKJF3MS3mYbARtQMdGss89s/3MoDOpiGcRNMCEbcgTrKhY8T58sHKCkfxJdQePobrYkhZLyrs1v0OLrRntaWHoLSm94DIvO8RWELmM+hDpjcH/0dh+Epw2CuGwwKR64slCPlwkcoWIOJEum9X7nokb3ncv8O9oWOj5UQnHrXrpLe6fBI5ud5PSIu3vrJQ0qnC9PX9M0V3efrq4KDIWT0Qxcb90fB74v+zs3rLojo9D5mb5z27d33qDe8Z4GZi0wlj5tOhpze+maTfsJzuA8PQnGl65t8y1v7ON6DiaELGysIEm3wTamD/4Oz4Js/E/6Z8qNPrEHKl4NTiMNrd8GXkm1kOyvWAW86hYiIlTfryPccInK6iNcvoavcIPb6IaFqnL3lUqW8ErqyKyIRtkBDLZyGCJKBAoc4MH2tQYTRpNY07ZCJ2iXGrPhnLP+y6QcXmkZ0/f9xDxeKC8PI8lCPlNeaulPvkcGHCvfhaEesnKBAMSzlgLwjhccrF9WRsr/HYWZ0C8Xdie7DdUHMGMyYDIUGgxm/3EnQQTGkZcZn+RPL7hiy9kVRZJ6Xb5aETzNMCJV67TfFlUOE5W/9iU9fUAx23rTEnIvTzptO7N6f1z7++vvMd25TLhx9MdxzD4fs+tdMzaybTk47vjyvXxfmXhcrc+ou/U5JsIu/ycHE0IWNtMcQTCcxeVwDGmtr4BFxCmRzqBYn1iCuLNS+G+H2XagTx1brpFErR7eY0enUWNgs2xdk+7w4tFzOQSpjIyWil5FV7JwjnS3AcbwiZkGEAhGERexs9gXHtx/ifOqUyk9KGmb0rFvD5AvbrRlhG10YRjKD00m5zmu4NaSu0+vPSXEMUa6nM2Sox/mR4Dqq3iHvUEeGd+nvOHRyTF9/gscnum/SbBGbY0wIygxJR9D0rRfM1PXoD8x2fOLXfvwmU0PourDeMEylcLFAmxmNBddNNz9vnEXqT4+ZcLLp5hdM+VPHPV/tN/MzJKZzaf/ZV2Vu+A891x31LgvsHcoOFZZhsQyyWBY2cHr6OzfvC0PR/RE8Pnjovnis4cLfwwjgxtcQOfHi0tKDh+EJm5B4ay22PPcKvOt34JhAA6a0ZdGwuRXBVWthvfkWPOvehbVlA+wdm+AR5+bID+MTlxUMeE1vIBkRRvOOqDi5QsESQSsgkc4jKfqXyco2CfmpO/MIdgI1CQ8yW0TU3pOQLFOqLWLXu2yIy2I0+eguKmY4WmC1wujjOioWwLPwn5UI02bM6lFZwO/l86w8OElcnsuCY4uD+FIk+4LlYBTM4yWkZRjq1p4OF6aVlQ6szHAdJtM8UOWBixvOkt7X7MJrGihM5hOdNXKszaQzoXC5LoBTZvUzaPmPC/dxMX1BwWP5jluIz5rWbse18lEjDHsdxt7yp97wHCwEZ9hL6BTDi84x34cC00FXybDRDf3oEquWfsZ8Hw7cj8Lfn7vsTfEe3GHORYF2qV32Nclja+W63ygtEWcqIetwRIrXRMHnb+XmJN7n2gv+yXzvi6q/usJcA+HvezC6NTJsYaOoFNZuxPYVr2DDsy8j2hpH1xursOHJp7D56aex48UVWP/scmx8+glsfe0leHbvRHUijqpUAp72VhRad8EX60Q4k4aVSJoX1dldeEaEiWMnsLI125GCtzWFqs6cuEB5mnfJJC4v6GE7OLFqFDbZjj+FafBLhRvlELQ3buE/Q1KWiTE8Pfv8C7vL2FjQXi5asa5OM/alu55CUz5ae18w/KSwuLWvI4VvSLAywx3fk2l+dvnAPQm7FSC8pis+d60RRdaW8jrLx9skgzUWpgBRTOjQyjOjCzNG3SDt11zo+ljg3XTziyJIZ5eWFmGmGkr7NbqLxPP3YvxXHjBuj7WQqdeKY5UOFV5T4oV7ux0jxaDz/m+U1g4PChCdpluu5U79lVnxHrBm2U0/J/7Vlzs+V6R4XJbdDQWKJh88rLxo/p+N5rhsmmOae/SD075T0vGg2ZZOnM6zr/aF7zfUhpGpgT8iqsKCzfGoETfWtXMTQj4gWiNP6WRKjJXMsGHt+EbUzZyFaN04bNvRCuxqk8fNOFTPOgoTJk+BJS4hk8/BE5YQNOiF319ANCz72hkkd2/DO79/ROK0XcD2NgRNzSj765CQ1rg+kTTRuaKkjZ2oDRc6N4pJ+YC7Q4H7USAHe81qJBx34skmfD6Qr2VRwMpfHXJhTRubXgzksnpDERv/pfvFefVsLjOSV7OUymfkwiZUN89ALB+AV0TIl+qAz04jHPSLA8sjJiGmP1qNnGRsSzKUL1qFHAdUjqXlrzQE1E8E6hoxY/FiBBvqEBlfx5H0YCdjiO/ehS0S1mbfeE1SKBk8FoMv60D2Mu3UOJ6CfDM9g2QL7NLy4GIkwkaHxHdC6ZpGewRxhpJsj0b35Y5criiVzH4JG6EbS1RFkNu+FehoF2ELo0amtj3tIj1WcQxQv0S8HFWKDo4qlJdPTxDwhRE+Yg6mzp0r4laDbRK6ta1ZY8YwRVdCVC4r+4gQiniF5TDsWSQrsWcmz+FeKG083MHj1FyGI2ws12KD10nNU0ftRXu6MzY/cdER45VDjf0WNsJxCQoR8VMpcWSZHAIiYHz3MyTuLVvIFAd2kTPxROZtJ75AZbN4TwQuKCHtRBZAikzt2VOsJMg5CDg2IrI+5WX/uHIsEUS+ypUUKWMvIdz+4JM0RVEOBkZF2LoJlbrwTqbgk5DRkhCVPXEE2AmkVTAVA+7JaNxMPSdHemcMWupsUtRQQlsbViJm2uAW+IqU6Q2EUiZhKJVxFBrgKopSuYyusBH2rOuPwMcuwmOdxUWiWUEJIQsULJnnxNeisnJmW4TL9KVmUboER+QuL9vJuqqw34xfyhQykSpniqIMhdEXthIWX4+qb0QiK3Jkiz/jmwP5nLgw9r9RFDZT5MYYVZZ65D+/iJtT4LijEn6ybE7+NwlURVMUZRiMmbD1gC6O4kShsvIiVKbATMJPkTQrIE5OwtVi4CmSZpsKAdPv2tinTFGUCuTACJuiKMoBpFRiryiKUjmosCmKUnGosPVi9uzZeOqpp3DbbbeVlowOPB6Py+MPlwcffBA33nhjaa5/eI6hpPvyyy/HY489hiOOGLh3ipNOOgnLly83n4ryl4QK20EORWjWrFm46KKL8OEPs8fTvqH4LF682Hxyn4E4//zzcfjhh+O6664rLembT33qU2hubsaXvvQlFAepVpS/DFTYDnIoQj/96U/xyiuv4JJLLikt3Reu4zbc9oILLuhXiCh64XAYX/nKVzB37tx+3RiXcz23C4VCuOyyy0prFOXgR4VtiDAcXLNmTffUOzSkELz66qvd6/m9P9EgDBn7Ok45rgg98MADuOeeezBnzpw+j+mKELfhtgMJEUXv6aefxsMPP4x33nnHuLK+RJBCuXr1avzmN78x2w8klopysKHCNggsE2M5E6F4UFxuvvlmXHrppd2iRAG69dZbcd9995n1nF5++WV8//vf7zN85H4UIx7n29/+dmnpvrgitHbtWjz33HNGaPoKCylCFEluw225zxVXXLFPeR7TSdGjSJOf/exnmD9//j4iWC6U7B6KYllbW4sbbrihtIWiHNyosA3CsmXLUFNTg1tuucVkcnLXXXcZETnhhGKvtAwX169f30Okvve97yEWi+HEE08sLSlyxhlnGFFkyMjj9AfFr66urluECIVo6tSpPQSGYnXMMceYdS4UIqb1+uuv7xZBitynP/1pI3rvvlscGITX8OabbxoRLK9IoHi6Qkkolo8//rgp5xvIhSrKwQRzq06lSQSg8NRTTxUkVDTz4sTMPJeXbyfCY5affvrpPbYvn0SUzHIRF/Mp4WnhrbfeMvv23lYnnXQavUkd2xDo6OgwrmUgNm1id80DEwwGTd9ortNTFGVsUGEbhM2bN5vwr3cINn36dCN4Tz75JNrb2/cRK4Z+DCUpeG4I29raim984xuYMmWKqTzQwnhFGRtU2AaB5VVdXV09Cu1ZrsU2Y27510MPPYSZM2f2qOF024iVl5ER1kT+4Ac/MELJCgdFUcaGfeLTQ3nqXcZWvmzNmjVmYjmZiFuP/TjP5e42vcvleLzyZSxn43Ysh2MZnLudTjrptP8TLQi/KIqiVAwaiiqKUnGosCmKUnGosCmKUnGosCmKUnGosCmKUnGosCmKUnGosCmKUnGosCmKUnGosCmKUnGosCmKUnGosCmKUnGosCmKUnGosCmKUnGosCmKUnGosCmKUnGosCmKUnGosCmKUnFoD7pDZPyEiQgEQ6W5vWQzabTs3lWaUxTlYECFbRCO/MAxOH7JyaiprcO2rZtLS/fSPHUaujo78Mzy32PD2jWlpYpy6MGH/3FLTjGfGXngMz+sfPVl8z0opmDBscfh8NlzzHeagZdX/HHMTIEK2wB85OyPyQ8xF8/84XG88+c3Skv3heJ38mkflR9yNZ549OHSUmWsKP4uc/DAz+/qzhhTDpuGZX9zufleDh86Tz72MN7bsu9DSRk9eP//+oJPGCHbtnUTqmvqsPDY40VcCvjtg/fJb3MZYl2deP3Vl0yUw3zFfPPbB+8dk99Gha0fjpcnzwL5YX7yw/8yT5zB4FNq2Sf/dlARVPYP92FTHHw63UPc+oK/IX/Ln//k/xqRU0YfOrBPf+4f8dKKZ0TYXiotLXKOiB0fQnRvjzz4y9LSIvxtFiw6Tn6bHw0pjw0HrTzoB950itRQbzgzF7dn2KqMDRS18ROaxBX/2hQLMLMs++TlppigP5jRYiJoNbW1pSXKaDN+4kT519pH1AgjGD7o+4pkuH0wFC7tP7qosPUBbTUdwXCdFzMaMxndmzI23C8OjaEMKWaaN81vNRCj7QaUnjRPnY7W3TtLcz3hvefv1N9vwP24/2ijwtYPIwlb3B8vGNq39lTZf/rKIHTJY1UArQwNlqmNG+HDfJw4cO4/2qiw9cNA4U1/sKyBZNLqEJRDh5Zdu8zf/nAjFW5Pt839RxsVtj5gLU0mkzG1NsOBhaSs+VEHoRxK0EWz2Ibl0sOB23O//sLU/UGFrR8Y4rAJx1CfQnxinXzaGaY6W1EONVgjSiPA8umhwO24PfcbC1TY+oFPEtbasAnHyUvPMA1x+6PY1OOyUoNEFbaDAT5o6KB7M1wXrgwNlklTpE4/62PdRTL9wfXcjtuPVRMcr0z/Uvyq9IZNCnbteA9Nk6fg+JNOxZJTloqINeHd1W+Xtii2dzvzY8uwdvUqPPX7R0tLlbGE5Z9TDps+YK31pOZmnHfRJZJxOjF+IguoN5vfaubsuXhr5WulrZTRhPeYvwvfMFj7zio4jl1asxeKGk1AR9ueMc0vKmyDwIxBJ/baSytkzkJD4ziToejSmHEmNU/Bbx/8pWaWAwgzx4mnnGZ+l2QiUVraE/5unNj2jbXUTZObEY1Wm+YifWU4ZXTYvHE9jpq3AEfOm7+PuPGBdN5Fn5RcZJnGumP5O+ibB8Og+MSfg/e2bDIFn25L67Eo/FQGhvefRQR9vY7z7PK9TUAYelLcWmWeoqa/1djDBw/vefNh00wTHT6AWCzAZdvk9xqoXdtoocI2DChsfLOAllvbT73/0AH09UYBmw+UZxy6a7o3FbUDCx8qrIArvv6WMXlmoOKD0USFbRgwg7BB4YH6cRSlEmAN6IHuhECFTVGUikObeyiKUnGosCmKUnGosCmKUnGosCmKUnGosCmKUnGosCmKUnGosCmKUnGosCmKUnGosCmKUnGosCmKUnGosCmKUnGosCmKUnGosCmKUnFYxyw6Tnv3UBSlotBuixRFqTg0FFUUpeJQYVMUpcIA/j8ZWOnE7awHfwAAAABJRU5ErkJggg=='
  //   )
  // ymap.set('user', user)

  // @ts-ignore
  window.example = { provider, ydoc, ytext, binding, Y };
  //editor.on("change", onEdit);
  //linter takes care of calling checkFragmentShader so we dont need
  // this editor.on function
  onEdit();
  init();
  animate();
}


// this function will trigger a change to the editor
function onEdit() {
  const fragmentCode = editor.getValue();
  updateShader(fragmentCode);
}

function updateShader(fragmentCode) {
  if (!checkFragmentShader(fragmentCode)) {
    return;
  }

  console.log("did update");
  _fragmentShader = fragmentCode;

  isDirty = true;
}

function updateScene() {
  scene = new THREE.Scene();
  geometry = new THREE.PlaneBufferGeometry(2, 2);

  try {
    material = new THREE.ShaderMaterial({
      uniforms: uniforms,
      vertexShader: vertexShader(),
      fragmentShader: fragmentShader()
    });
  } catch (e) {
    console.log("MY ERROR", e);
    return;
  }

  mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);
}

window.onload = (event) => {
  var goButton = document.getElementById("goButton");
  goButton.onclick = initYdoc;
}

function init() {
  container = document.getElementById("container");

  threeCam = new THREE.Camera();
  threeCam.position.z = 1;

  // video = document.querySelector( 'video' );
  // feed = new THREE.VideoTexture( video );

  uniforms = {
    u_time: { type: "f", value: 1.0 },
    u_resolution: { type: "v2", value: new THREE.Vector2() },
    u_mouse: { type: "v2", value: new THREE.Vector2() },
    u_camRot: { type: "v3", value: new THREE.Vector3() }
    // u_feed: {type: "", value: new THREE.VideoTexture(video)}
  };

  updateScene();
  container = document.getElementById("container");
  renderer = new THREE.WebGLRenderer();
  renderer.setPixelRatio(window.devicePixelRatio);

  gl = renderer.getContext();

  container.appendChild(renderer.domElement);

  onWindowResize();
  window.addEventListener("resize", onWindowResize, false);
}

function onWindowResize(event) {
  renderer.setSize(window.innerWidth, window.innerHeight);
  uniforms.u_resolution.value.x = renderer.domElement.width;
  uniforms.u_resolution.value.y = renderer.domElement.height;
}

function animate() {
  requestAnimationFrame(animate);
  render();
}

function render() {
  if (isDirty) {
    updateScene();
  }
  uniforms.u_time.value += 0.05;
  // uniforms.u_feed.value = feed;
  renderer.render(scene, threeCam);
}

function vertexShader() {
  return `        
    void main() {
      gl_Position = vec4( position, 1.0 );
    }
  `;
}

function fragmentShader() {
  return _fragmentShader;
}

// this returns false if the fragment shader cannot compile
// true if it can

function checkFragmentShader(shaderCode, lint = false) {
  if (!gl) {
    return;
  }
  let shader = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(shader, shaderCode);
  gl.compileShader(shader);
  let infoLog = gl.getShaderInfoLog(shader);
  let result = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
  let ret = [];
  if (!result) {
    console.log(infoLog);
    var errors = infoLog.split(/\r|\n/);
    for (let error of errors){
      var splitResult = error.split(":")
      ret.push( {
        message: splitResult[3] + splitResult[4],
        character: splitResult[1],
        line: splitResult[2]
      })
    }
  }
  
  if (result) {
    console.log("did update");
    _fragmentShader = shaderCode;
    isDirty = true;
  }

  return ret;
}


(function(mod) {
    mod(CodeMirror);
})(function(CodeMirror) {
  "use strict";

  function validator(text, options) {
    var result = [];
    var errors = checkFragmentShader(text, true);
    if (errors) parseErrors(errors, result);
    return result;
  }

  CodeMirror.registerHelper("lint", "x-shader/x-vertex", validator);

  function parseErrors(errors, output) {
    for ( var i = 0; i < errors.length; i++) {
      var error = errors[i];
      if (error) {
        if (Number(error.line) <= 0) {
          console.warn("Cannot display error (invalid line " + error.line + ")", error);
          continue;
        }

        var start = error.character - 1, end = start + 1;


        // Convert to format expected by validation service
        var hint = {
          message: error.message,
          severity: "error",
          from: CodeMirror.Pos(Number(error.line) - 1, start),
          to: CodeMirror.Pos(Number(error.line) - 1, end)
        };

        output.push(hint);
      }
    }
  }
});